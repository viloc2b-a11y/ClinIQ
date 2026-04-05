/**
 * Document Engine v1 — revenue-protection review actions → draft event-log rows (no persistence).
 */

import type { ReviewAction } from "../matching/build-review-actions-from-leakage-signals"

export type { ReviewAction }

const EMPTY_INPUT_WARNING = "No review actions provided for draft event log rows."

export type DraftRevenueReviewEventRow = {
  draftEventId: string
  eventType: "revenue_review_action"
  eventStatus: "open"
  actionId: string
  actionType: ReviewAction["actionType"]
  priority: ReviewAction["priority"]
  severity: ReviewAction["severity"]
  title: string
  description: string
  matchKey: string
  expectedIndex: number | null
  invoiceIndex: number | null
  sourceSignalType: ReviewAction["sourceSignalType"]
  reasons: string[]
}

export type ToDraftEventLogRowsResult = {
  documentId: string | null
  rows: DraftRevenueReviewEventRow[]
  summary: {
    totalActions: number
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

export function toDraftEventLogRows(input: {
  documentId: string | null
  actions: ReviewAction[]
}): ToDraftEventLogRowsResult {
  const { documentId, actions } = input

  const rows: DraftRevenueReviewEventRow[] = actions.map((a) => ({
    draftEventId: `draft-event::${a.actionId}`,
    eventType: "revenue_review_action",
    eventStatus: "open",
    actionId: a.actionId,
    actionType: a.actionType,
    priority: a.priority,
    severity: a.severity,
    title: a.title,
    description: a.description,
    matchKey: a.matchKey,
    expectedIndex: a.expectedIndex,
    invoiceIndex: a.invoiceIndex,
    sourceSignalType: a.sourceSignalType,
    reasons: [...a.reasons],
  }))

  let priority1Count = 0
  let priority2Count = 0
  let priority3Count = 0
  let highSeverityCount = 0
  let mediumSeverityCount = 0
  let lowSeverityCount = 0

  for (const a of actions) {
    if (a.priority === 1) priority1Count += 1
    else if (a.priority === 2) priority2Count += 1
    else priority3Count += 1

    if (a.severity === "high") highSeverityCount += 1
    else if (a.severity === "medium") mediumSeverityCount += 1
    else lowSeverityCount += 1
  }

  const warnings: string[] = []
  if (actions.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  return {
    documentId,
    rows,
    summary: {
      totalActions: actions.length,
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
