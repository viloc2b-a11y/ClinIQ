/**
 * Document Engine v1 — deterministic review action queue from leakage signals (no Action Center).
 */

import type { LeakageSignal, LeakageSignalType, LeakageSeverity } from "./classify-match-results-into-leakage-signals"

export type { LeakageSignal } from "./classify-match-results-into-leakage-signals"

export type ReviewActionType =
  | "review_missing_invoice"
  | "review_unexpected_invoice"
  | "review_quantity_mismatch"
  | "review_unit_price_mismatch"
  | "review_total_price_mismatch"
  | "review_incomplete_comparison"

export type ReviewActionPriority = 1 | 2 | 3

export type ReviewAction = {
  actionId: string
  priority: ReviewActionPriority
  actionType: ReviewActionType
  title: string
  description: string
  expectedIndex: number | null
  invoiceIndex: number | null
  matchKey: string
  sourceSignalType: LeakageSignalType
  severity: LeakageSeverity
  reasons: string[]
  status: "open"
}

export type BuildReviewActionsSummary = {
  totalActions: number
  byPriority: Record<string, number>
  byActionType: Record<string, number>
  highPriorityCount: number
  mediumPriorityCount: number
  lowPriorityCount: number
}

export type BuildReviewActionsFromLeakageSignalsResult = {
  actions: ReviewAction[]
  summary: BuildReviewActionsSummary
  warnings: string[]
}

const NO_ACTIONS_WARNING = "No review actions generated."

const TITLE_BY_SIGNAL: Readonly<Record<LeakageSignalType, string>> = {
  missing_invoice: "Missing invoice review",
  unexpected_invoice: "Unexpected invoice review",
  quantity_mismatch: "Quantity mismatch review",
  unit_price_mismatch: "Unit price mismatch review",
  total_price_mismatch: "Total price mismatch review",
  incomplete_comparison: "Incomplete comparison review",
}

export function mapSignalToActionType(signalType: LeakageSignalType): ReviewActionType {
  switch (signalType) {
    case "missing_invoice":
      return "review_missing_invoice"
    case "unexpected_invoice":
      return "review_unexpected_invoice"
    case "quantity_mismatch":
      return "review_quantity_mismatch"
    case "unit_price_mismatch":
      return "review_unit_price_mismatch"
    case "total_price_mismatch":
      return "review_total_price_mismatch"
    case "incomplete_comparison":
      return "review_incomplete_comparison"
  }
}

export function mapSeverityToPriority(severity: LeakageSeverity): ReviewActionPriority {
  switch (severity) {
    case "high":
      return 1
    case "medium":
      return 2
    case "low":
      return 3
  }
}

export function buildActionId(
  actionType: ReviewActionType,
  matchKey: string,
  expectedIndex: number | null,
  invoiceIndex: number | null,
): string {
  const e = expectedIndex === null ? "x" : String(expectedIndex)
  const i = invoiceIndex === null ? "x" : String(invoiceIndex)
  return `${actionType}::${encodeURIComponent(matchKey)}::${e}::${i}`
}

function buildDescription(title: string, matchKey: string): string {
  return `${title} for match key: ${matchKey}`
}

export function buildSummary(actions: ReviewAction[]): BuildReviewActionsSummary {
  const byPriority: Record<string, number> = { "1": 0, "2": 0, "3": 0 }
  const typeMap = new Map<string, number>()
  for (const a of actions) {
    const pk = String(a.priority)
    byPriority[pk] = (byPriority[pk] ?? 0) + 1
    typeMap.set(a.actionType, (typeMap.get(a.actionType) ?? 0) + 1)
  }
  const typeKeys = [...typeMap.keys()].sort((a, b) => a.localeCompare(b))
  const byActionType: Record<string, number> = {}
  for (const k of typeKeys) {
    byActionType[k] = typeMap.get(k) ?? 0
  }
  return {
    totalActions: actions.length,
    byPriority,
    byActionType,
    highPriorityCount: byPriority["1"] ?? 0,
    mediumPriorityCount: byPriority["2"] ?? 0,
    lowPriorityCount: byPriority["3"] ?? 0,
  }
}

/**
 * One review action per leakage signal; fixed titles, descriptions, and stable action IDs.
 */
export function buildReviewActionsFromLeakageSignals(input: {
  signals: LeakageSignal[]
  warnings?: string[]
}): BuildReviewActionsFromLeakageSignalsResult {
  const { signals, warnings: inputWarnings } = input
  const warnings = [...(inputWarnings ?? [])]

  const actions: ReviewAction[] = []
  for (const sig of signals) {
    const actionType = mapSignalToActionType(sig.signalType)
    const priority = mapSeverityToPriority(sig.severity)
    const title = TITLE_BY_SIGNAL[sig.signalType]
    const description = buildDescription(title, sig.matchKey)
    actions.push({
      actionId: buildActionId(actionType, sig.matchKey, sig.expectedIndex, sig.invoiceIndex),
      priority,
      actionType,
      title,
      description,
      expectedIndex: sig.expectedIndex,
      invoiceIndex: sig.invoiceIndex,
      matchKey: sig.matchKey,
      sourceSignalType: sig.signalType,
      severity: sig.severity,
      reasons: [...sig.reasons],
      status: "open",
    })
  }

  if (signals.length === 0) {
    warnings.push(NO_ACTIONS_WARNING)
  }

  return {
    actions,
    summary: buildSummary(actions),
    warnings,
  }
}
