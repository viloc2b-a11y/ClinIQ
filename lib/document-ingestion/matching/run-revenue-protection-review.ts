/**
 * Document Engine v1 — thin orchestrator: match → leakage signals → review actions (no core / UI).
 */

import { buildReviewActionsFromLeakageSignals } from "./build-review-actions-from-leakage-signals"
import { classifyMatchResultsIntoLeakageSignals } from "./classify-match-results-into-leakage-signals"
import { matchExpectedToInvoice } from "./match-expected-to-invoice"
import type { ExpectedRow, InvoiceRow } from "./match-expected-to-invoice"

export type { ExpectedRow, InvoiceRow }

export type RevenueProtectionReviewSummary = {
  totalExpected: number
  totalInvoice: number
  matchedCount: number
  partialMismatchCount: number
  leakageSignalCount: number
  reviewActionCount: number
  highPriorityActionCount: number
}

export type RunRevenueProtectionReviewResult = {
  matchResult: ReturnType<typeof matchExpectedToInvoice>
  leakage: ReturnType<typeof classifyMatchResultsIntoLeakageSignals>
  actions: ReturnType<typeof buildReviewActionsFromLeakageSignals>
  summary: RevenueProtectionReviewSummary
  warnings: string[]
}

function mergeWarningsInOrder(batches: readonly string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const batch of batches) {
    for (const w of batch) {
      if (!seen.has(w)) {
        seen.add(w)
        out.push(w)
      }
    }
  }
  return out
}

/**
 * End-to-end deterministic revenue-protection review for pre-built expected vs invoice rows.
 */
export async function runRevenueProtectionReview(input: {
  expectedRows: ExpectedRow[]
  invoiceRows: InvoiceRow[]
}): Promise<RunRevenueProtectionReviewResult> {
  const { expectedRows, invoiceRows } = input

  const matchResult = matchExpectedToInvoice({
    expectedRows,
    invoiceRows,
  })

  const leakage = classifyMatchResultsIntoLeakageSignals({ matchResult })

  const actions = buildReviewActionsFromLeakageSignals({
    signals: leakage.signals,
    warnings: leakage.warnings,
  })

  const summary: RevenueProtectionReviewSummary = {
    totalExpected: expectedRows.length,
    totalInvoice: invoiceRows.length,
    matchedCount: matchResult.summary.matchedCount,
    partialMismatchCount: matchResult.summary.partialMismatchCount,
    leakageSignalCount: leakage.summary.totalSignals,
    reviewActionCount: actions.summary.totalActions,
    highPriorityActionCount: actions.summary.highPriorityCount,
  }

  const warnings = mergeWarningsInOrder([
    matchResult.warnings,
    leakage.warnings,
    actions.warnings,
  ])

  return {
    matchResult,
    leakage,
    actions,
    summary,
    warnings,
  }
}
