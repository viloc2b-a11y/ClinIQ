/**
 * Document Engine v1 — write-input rows → event-store handoff payload (no persistence).
 */

import type { EventStoreWriteInputRow } from "./to-event-store-write-input"

export type { EventStoreWriteInputRow }

const EMPTY_INPUT_WARNING = "No event-store write-input rows provided for handoff."

export type ToEventStoreHandoffPayloadResult = {
  documentId: string | null
  eventCount: number
  events: EventStoreWriteInputRow[]
  summary: {
    totalRows: number
    priority1Count: number
    priority2Count: number
    priority3Count: number
    highSeverityCount: number
    mediumSeverityCount: number
    lowSeverityCount: number
  }
  warnings: string[]
}

/** Alias for {@link ToEventStoreHandoffPayloadResult} — consumed by event-store boundary adapters. */
export type EventStoreHandoffPayload = ToEventStoreHandoffPayloadResult

export function toEventStoreHandoffPayload(input: {
  documentId: string | null
  rows: EventStoreWriteInputRow[]
}): ToEventStoreHandoffPayloadResult {
  const { documentId, rows } = input

  let priority1Count = 0
  let priority2Count = 0
  let priority3Count = 0
  let highSeverityCount = 0
  let mediumSeverityCount = 0
  let lowSeverityCount = 0

  for (const r of rows) {
    if (r.priority === 1) priority1Count += 1
    else if (r.priority === 2) priority2Count += 1
    else priority3Count += 1

    if (r.severity === "high") highSeverityCount += 1
    else if (r.severity === "medium") mediumSeverityCount += 1
    else lowSeverityCount += 1
  }

  const warnings: string[] = []
  if (rows.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  return {
    documentId,
    eventCount: rows.length,
    events: rows,
    summary: {
      totalRows: rows.length,
      priority1Count,
      priority2Count,
      priority3Count,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
    },
    warnings,
  }
}
