import { appendAudit } from "./audit-log"
import { trackWriteAttempt, trackWriteFail, trackWriteSuccess } from "./metrics"
import { getPersistenceAdapter } from "./persistence/get-adapter"
import { getWriteStatus } from "./summary/status"

import type { ActionCenterRecord } from "./persistence/types"
import type { ActionCenterWriteSummary } from "./summary/types"

function payloadStringId(payload: unknown): string {
  if (payload !== null && typeof payload === "object" && "id" in payload) {
    const v = (payload as { id?: unknown }).id
    if (typeof v === "string" && v.length > 0) {
      return v
    }
  }
  return ""
}

/** Deterministic id for idempotency (Step 57). */
export function buildDeterministicId(record: ActionCenterRecord): string {
  const fromPayload = payloadStringId(record.payload)
  const base = fromPayload.length > 0 ? fromPayload : record.id
  return `${record.type}::${base}`
}

export type WriteActionCenterRecordsResult = ActionCenterWriteSummary

/**
 * App-level dedupe + DB upsert idempotency (Step 61) + audit + metrics.
 * Prefer this over calling {@link getPersistenceAdapter}().write directly for the record store.
 */
export async function writeActionCenterRecords(
  records: ActionCenterRecord[],
): Promise<WriteActionCenterRecordsResult> {
  const uniqueMap = new Map<string, ActionCenterRecord>()
  for (const r of records) {
    const id = buildDeterministicId(r)
    uniqueMap.set(id, { ...r, id })
  }
  const deduped = Array.from(uniqueMap.values())

  trackWriteAttempt()

  if (deduped.length === 0) {
    trackWriteSuccess()
    const summary: ActionCenterWriteSummary = {
      ok: true,
      partial: false,
      attempted: 0,
      written: 0,
      status: getWriteStatus({
        ok: true,
        partial: false,
        attempted: 0,
        written: 0,
      }),
    }
    return summary
  }

  for (const record of deduped) {
    appendAudit({
      id: record.id,
      step: "write_attempt",
      timestamp: new Date().toISOString(),
    })
  }

  const adapter = getPersistenceAdapter()

  try {
    const result = await adapter.write(deduped)

    if (result.written !== deduped.length) {
      for (const record of deduped) {
        appendAudit({
          id: record.id,
          step: "write_fail",
          timestamp: new Date().toISOString(),
        })
      }

      trackWriteFail()

      const summary: ActionCenterWriteSummary = {
        ok: false,
        partial: result.written > 0,
        attempted: deduped.length,
        written: result.written,
        status: getWriteStatus({
          ok: false,
          partial: result.written > 0,
          attempted: deduped.length,
          written: result.written,
        }),
      }
      return summary
    }

    for (const record of deduped) {
      appendAudit({
        id: record.id,
        step: "write_success",
        timestamp: new Date().toISOString(),
      })
    }

    trackWriteSuccess()

    const summary: ActionCenterWriteSummary = {
      ok: true,
      partial: false,
      attempted: deduped.length,
      written: result.written,
      status: getWriteStatus({
        ok: true,
        partial: false,
        attempted: deduped.length,
        written: result.written,
      }),
    }
    return summary
  } catch {
    for (const record of deduped) {
      appendAudit({
        id: record.id,
        step: "write_fail",
        timestamp: new Date().toISOString(),
      })
    }

    trackWriteFail()

    const summary: ActionCenterWriteSummary = {
      ok: false,
      partial: false,
      attempted: deduped.length,
      written: 0,
      status: getWriteStatus({
        ok: false,
        partial: false,
        attempted: deduped.length,
        written: 0,
      }),
    }
    return summary
  }
}
