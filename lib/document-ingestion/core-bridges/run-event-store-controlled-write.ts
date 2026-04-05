/**
 * Document Engine v1 — controlled boundary wrapper: validate + dry partition + optional write (injected writer or Action Center adapter).
 *
 * Safe built-in path (no Supabase here): {@link ActionCenterPersistenceAdapter.upsertActionItems} via {@link mapRowToActionCenterItem}
 * when `allowWrite` + `persistenceAdapter` and no `writer`. Injected `writer` takes precedence.
 */

import type { ActionCenterPersistenceAdapter } from "../../cliniq-core/action-center/persistence-adapter"
import type { ActionItemRow } from "../../cliniq-core/action-center/persistence-types"
import { mapRowToActionCenterItem } from "../../cliniq-core/action-center/persistence-mappers"

import { boundaryRowClientRef } from "./run-event-store-dry-write"
import { validateEventStoreBoundary } from "./validate-event-store-boundary"

export type BoundaryRow = any

export type ControlledWriterResult = {
  succeeded: Array<{
    index: number
    clientRef: string | null
  }>
  failed: Array<{
    index: number
    clientRef: string | null
    reasons: string[]
  }>
  notes?: string[]
}

export type ControlledWriter = (input: { rows: BoundaryRow[] }) => Promise<ControlledWriterResult>

const NOTE_WRITE_DISABLED = "Write disabled. Returning dry-run style result only."
const NOTE_NO_SAFE_WRITER = "No safe boundary write function is currently available."
const NOTE_NO_ACCEPTED_TO_UPSERT = "No accepted rows to upsert."

const WARN_EMPTY = "No boundary rows provided for controlled write."
const WARN_REJECTED = "Some boundary rows were rejected before write."
const WARN_DRY_RUN_MODE = "Controlled write ran in dry_run mode."
const WARN_WRITE_REQUESTED_NO_ADAPTER =
  "Write was requested but no safe boundary writer is available."
const WARN_WRITE_FAILURE = "Boundary write attempt reported failures."

export type RunEventStoreControlledWriteInput = {
  rows: BoundaryRow[]
  allowWrite?: boolean
  writer?: ControlledWriter
  /**
   * Used when `allowWrite` is true and `writer` is omitted: upserts accepted rows in-process (e.g. {@link MemoryPersistenceAdapter}).
   */
  persistenceAdapter?: ActionCenterPersistenceAdapter
}

export type RunEventStoreControlledWriteResult = {
  mode: "dry_run" | "write_attempt"
  validation: {
    validRows: number
    invalidRows: number
    errors: Array<{
      index: number
      reasons: string[]
    }>
  }
  accepted: Array<{
    index: number
    clientRef: string | null
    status: "accepted"
  }>
  rejected: Array<{
    index: number
    clientRef: string | null
    status: "rejected"
    reasons: string[]
  }>
  writeResult: {
    attempted: boolean
    succeeded: number
    failed: number
    notes: string[]
  }
  summary: {
    totalRows: number
    acceptedCount: number
    rejectedCount: number
    attemptedWriteCount: number
    succeededWriteCount: number
    failedWriteCount: number
  }
  warnings: string[]
}

/** Maps a {@link ControlledWriterResult} into aggregate counts and flattens notes. */
export function mapWriterResult(writerResult: ControlledWriterResult): {
  succeeded: number
  failed: number
  notes: string[]
} {
  const notes: string[] = []
  if (writerResult.notes !== undefined && writerResult.notes.length > 0) {
    notes.push(...writerResult.notes)
  }
  return {
    succeeded: writerResult.succeeded.length,
    failed: writerResult.failed.length,
    notes,
  }
}

async function maybeWriteAcceptedRows(params: {
  rows: BoundaryRow[]
  acceptedIndices: number[]
  adapter: ActionCenterPersistenceAdapter
}): Promise<{ succeeded: number; failed: number; notes: string[] }> {
  const notes: string[] = []
  const items = []
  for (const i of params.acceptedIndices) {
    const row = params.rows[i] as ActionItemRow
    try {
      items.push(mapRowToActionCenterItem(row))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      notes.push(`mapRowToActionCenterItem failed at index ${i}: ${msg}`)
      return { succeeded: 0, failed: params.acceptedIndices.length, notes }
    }
  }
  try {
    await params.adapter.upsertActionItems(items)
    return { succeeded: items.length, failed: 0, notes }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    notes.push(`upsertActionItems failed: ${msg}`)
    return { succeeded: 0, failed: items.length, notes }
  }
}

export async function runEventStoreControlledWrite(
  input: RunEventStoreControlledWriteInput,
): Promise<RunEventStoreControlledWriteResult> {
  const { rows } = input
  const allowWrite = input.allowWrite === true
  const warnings: string[] = []

  if (rows.length === 0) {
    warnings.push(WARN_EMPTY)
  }

  const validation = validateEventStoreBoundary({ rows })
  const invalidByIndex = new Map<number, string[]>()
  for (const e of validation.errors) {
    invalidByIndex.set(e.index, e.reasons)
  }

  const accepted: RunEventStoreControlledWriteResult["accepted"] = []
  const rejected: RunEventStoreControlledWriteResult["rejected"] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const clientRef = boundaryRowClientRef(row)
    if (invalidByIndex.has(i)) {
      rejected.push({
        index: i,
        clientRef,
        status: "rejected",
        reasons: invalidByIndex.get(i)!,
      })
    } else {
      accepted.push({ index: i, clientRef, status: "accepted" })
    }
  }

  if (rejected.length > 0) {
    warnings.push(WARN_REJECTED)
  }

  const writeNotes: string[] = []
  let attempted = false
  let succeeded = 0
  let failed = 0

  if (!allowWrite) {
    writeNotes.push(NOTE_WRITE_DISABLED)
    warnings.push(WARN_DRY_RUN_MODE)
  } else {
    const acceptedOnlyRows = accepted.map((a) => rows[a.index] as BoundaryRow)

    if (acceptedOnlyRows.length === 0) {
      writeNotes.push(NOTE_NO_ACCEPTED_TO_UPSERT)
    } else if (input.writer !== undefined) {
      attempted = true
      try {
        const wr = await input.writer({ rows: acceptedOnlyRows })
        const mapped = mapWriterResult(wr)
        succeeded = mapped.succeeded
        failed = mapped.failed
        writeNotes.push(...mapped.notes)
        if (failed > 0) {
          warnings.push(WARN_WRITE_FAILURE)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        writeNotes.push(`Boundary writer threw error: ${msg}`)
        succeeded = 0
        failed = acceptedOnlyRows.length
        warnings.push(WARN_WRITE_FAILURE)
      }
    } else if (input.persistenceAdapter !== undefined) {
      attempted = true
      const r = await maybeWriteAcceptedRows({
        rows,
        acceptedIndices: accepted.map((a) => a.index),
        adapter: input.persistenceAdapter,
      })
      succeeded = r.succeeded
      failed = r.failed
      writeNotes.push(...r.notes)
      if (failed > 0) {
        warnings.push(WARN_WRITE_FAILURE)
      }
    } else {
      writeNotes.push(NOTE_NO_SAFE_WRITER)
      warnings.push(WARN_WRITE_REQUESTED_NO_ADAPTER)
    }
  }

  const mode: RunEventStoreControlledWriteResult["mode"] = allowWrite ? "write_attempt" : "dry_run"
  const acceptedCount = accepted.length
  const rejectedCount = rejected.length
  const attemptedWriteCount = allowWrite ? acceptedCount : 0

  return {
    mode,
    validation: {
      validRows: validation.validRows,
      invalidRows: validation.invalidRows,
      errors: validation.errors.map((e) => ({ index: e.index, reasons: [...e.reasons] })),
    },
    accepted,
    rejected,
    writeResult: {
      attempted,
      succeeded,
      failed,
      notes: writeNotes,
    },
    summary: {
      totalRows: rows.length,
      acceptedCount,
      rejectedCount,
      attemptedWriteCount,
      succeededWriteCount: succeeded,
      failedWriteCount: failed,
    },
    warnings,
  }
}
