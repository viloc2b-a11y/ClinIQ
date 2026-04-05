/**
 * Document Engine v1 — simulate persistence acceptance/rejection from boundary rows (no DB).
 */

import { validateEventStoreBoundary } from "./validate-event-store-boundary"

export type BoundaryRow = any

const EMPTY_ROWS_WARNING = "No boundary rows provided for dry write."
const REJECTED_WARNING = "Some boundary rows were rejected during dry write."

function documentEngine(row: BoundaryRow): Record<string, unknown> | null {
  const m = row?.metadata
  if (typeof m !== "object" || m === null || Array.isArray(m)) return null
  const de = (m as Record<string, unknown>).documentEngine
  if (typeof de !== "object" || de === null || Array.isArray(de)) return null
  return de as Record<string, unknown>
}

/**
 * Stable client reference for dry-run reporting.
 * Preference: clientEventId (top-level or documentEngine), eventId, sourceActionId; then row.id (ActionItemRow PK).
 */
export function boundaryRowClientRef(row: BoundaryRow): string | null {
  const c0 = row?.clientEventId
  if (typeof c0 === "string" && c0.length > 0) return c0
  const de = documentEngine(row)
  const c1 = de?.clientEventId
  if (typeof c1 === "string" && c1.length > 0) return c1
  const eid = row?.eventId
  if (typeof eid === "string" && eid.length > 0) return eid
  const sa = de?.sourceActionId ?? row?.sourceActionId
  if (typeof sa === "string" && sa.length > 0) return sa
  const id = row?.id
  if (typeof id === "string" && id.length > 0) return id
  return null
}

export type EventStoreDryWriteAccepted = {
  index: number
  clientRef: string | null
  status: "accepted"
}

export type EventStoreDryWriteRejected = {
  index: number
  clientRef: string | null
  status: "rejected"
  reasons: string[]
}

export type RunEventStoreDryWriteResult = {
  accepted: EventStoreDryWriteAccepted[]
  rejected: EventStoreDryWriteRejected[]
  summary: {
    totalRows: number
    acceptedCount: number
    rejectedCount: number
  }
  warnings: string[]
}

export async function runEventStoreDryWrite(input: {
  rows: BoundaryRow[]
}): Promise<RunEventStoreDryWriteResult> {
  const { rows } = input
  const warnings: string[] = []

  if (rows.length === 0) {
    warnings.push(EMPTY_ROWS_WARNING)
  }

  const validation = validateEventStoreBoundary({ rows })
  const invalidByIndex = new Map<number, string[]>()
  for (const e of validation.errors) {
    invalidByIndex.set(e.index, e.reasons)
  }

  const accepted: EventStoreDryWriteAccepted[] = []
  const rejected: EventStoreDryWriteRejected[] = []

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
    warnings.push(REJECTED_WARNING)
  }

  return {
    accepted,
    rejected,
    summary: {
      totalRows: rows.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
    },
    warnings,
  }
}
