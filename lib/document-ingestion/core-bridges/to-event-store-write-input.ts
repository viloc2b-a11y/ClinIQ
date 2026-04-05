/**
 * Document Engine v1 — event-log schema candidates → event-store write input shape (no persistence).
 */

import type { EventLogSchemaCandidateRow } from "./to-event-log-schema-candidate"

const EMPTY_INPUT_WARNING =
  "No event-log candidate rows provided for event-store write input."

export type EventStoreWriteInputRow = {
  clientEventId: string
  eventType: "revenue_review_action"
  eventStatus: "open"
  title: string
  description: string
  priority: 1 | 2 | 3
  severity: "low" | "medium" | "high"
  sourceDocumentId: string | null
  sourceActionId: string
  sourceDraftEventId: string
  sourceSignalType: EventLogSchemaCandidateRow["sourceRef"]["sourceSignalType"]
  sourceActionType: EventLogSchemaCandidateRow["sourceRef"]["actionType"]
  matchKey: string
  expectedIndex: number | null
  invoiceIndex: number | null
  reasons: string[]
  metadata: {
    category: "revenue_protection"
    candidateType: "review_action"
  }
}

export type ToEventStoreWriteInputResult = {
  documentId: string | null
  rows: EventStoreWriteInputRow[]
  summary: {
    totalCandidateRows: number
    totalWriteRows: number
    openCount: number
    priority1Count: number
    priority2Count: number
    priority3Count: number
    highSeverityCount: number
    mediumSeverityCount: number
    lowSeverityCount: number
  }
  warnings: string[]
}

export function toEventStoreWriteInput(input: {
  documentId: string | null
  rows: EventLogSchemaCandidateRow[]
}): ToEventStoreWriteInputResult {
  const { documentId, rows } = input

  const out: EventStoreWriteInputRow[] = rows.map((row) => ({
    clientEventId: `write-input::${row.eventId}`,
    eventType: "revenue_review_action",
    eventStatus: "open",
    title: row.title,
    description: row.description,
    priority: row.priority,
    severity: row.severity,
    sourceDocumentId: row.sourceRef.documentId,
    sourceActionId: row.sourceRef.actionId,
    sourceDraftEventId: row.sourceRef.draftEventId,
    sourceSignalType: row.sourceRef.sourceSignalType,
    sourceActionType: row.sourceRef.actionType,
    matchKey: row.payload.matchKey,
    expectedIndex: row.payload.expectedIndex,
    invoiceIndex: row.payload.invoiceIndex,
    reasons: [...row.payload.reasons],
    metadata: {
      category: "revenue_protection",
      candidateType: "review_action",
    },
  }))

  let priority1Count = 0
  let priority2Count = 0
  let priority3Count = 0
  let highSeverityCount = 0
  let mediumSeverityCount = 0
  let lowSeverityCount = 0

  for (const r of out) {
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
    rows: out,
    summary: {
      totalCandidateRows: rows.length,
      totalWriteRows: out.length,
      openCount: out.length,
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
