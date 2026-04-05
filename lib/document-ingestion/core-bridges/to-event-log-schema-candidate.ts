/**
 * Document Engine v1 — draft event rows → event-log schema candidate (no persistence / DB).
 */

import type { DraftRevenueReviewEventRow } from "./to-draft-event-log-rows"

/** Alias matching spec naming; same shape as {@link DraftRevenueReviewEventRow}. */
export type DraftEventRow = DraftRevenueReviewEventRow

const EMPTY_INPUT_WARNING = "No draft event rows provided for event-log schema candidate."

export type EventLogSchemaCandidateRow = {
  eventId: string
  category: "revenue_protection"
  type: "review_action"
  status: "open"
  title: string
  description: string
  priority: DraftEventRow["priority"]
  severity: DraftEventRow["severity"]
  sourceRef: {
    documentId: string | null
    actionId: string
    draftEventId: string
    sourceSignalType: DraftEventRow["sourceSignalType"]
    actionType: DraftEventRow["actionType"]
  }
  payload: {
    matchKey: string
    expectedIndex: number | null
    invoiceIndex: number | null
    reasons: string[]
  }
}

export type ToEventLogSchemaCandidateResult = {
  documentId: string | null
  rows: EventLogSchemaCandidateRow[]
  summary: {
    totalDraftRows: number
    totalCandidateRows: number
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

export function toEventLogSchemaCandidate(input: {
  documentId: string | null
  rows: DraftEventRow[]
}): ToEventLogSchemaCandidateResult {
  const { documentId, rows } = input

  const out: EventLogSchemaCandidateRow[] = rows.map((r) => ({
    eventId: `event-candidate::${r.draftEventId}`,
    category: "revenue_protection",
    type: "review_action",
    status: "open",
    title: r.title,
    description: r.description,
    priority: r.priority,
    severity: r.severity,
    sourceRef: {
      documentId,
      actionId: r.actionId,
      draftEventId: r.draftEventId,
      sourceSignalType: r.sourceSignalType,
      actionType: r.actionType,
    },
    payload: {
      matchKey: r.matchKey,
      expectedIndex: r.expectedIndex,
      invoiceIndex: r.invoiceIndex,
      reasons: [...r.reasons],
    },
  }))

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
    rows: out,
    summary: {
      totalDraftRows: rows.length,
      totalCandidateRows: out.length,
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
