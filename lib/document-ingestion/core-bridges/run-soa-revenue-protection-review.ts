/**
 * Document Engine v1 — classified SoA → expected billables → revenue-protection review (no ledger / new matcher logic).
 */

import { buildInitialExpectedBillables } from "./build-initial-expected-billables"
import type { ClassifiedCoreSoaActivity } from "./classify-core-soa-activities"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
import type { InvoiceRow } from "../matching/match-expected-to-invoice"
import { runRevenueProtectionReview } from "../matching/run-revenue-protection-review"

/** Alias matching spec naming; same shape as {@link ClassifiedCoreSoaActivity}. */
export type ClassifiedSoaActivity = ClassifiedCoreSoaActivity

export type { InvoiceRow }

export type RunSoaRevenueProtectionReviewSummary = {
  totalActivities: number
  totalExpectedBillables: number
  totalExpectedRows: number
  totalInvoiceRows: number
  matchedCount: number
  partialMismatchCount: number
  leakageSignalCount: number
  reviewActionCount: number
  highPriorityActionCount: number
}

export type RunSoaRevenueProtectionReviewResult = {
  expectedBillables: ReturnType<typeof buildInitialExpectedBillables>
  expectedRows: ReturnType<typeof toRevenueProtectionExpectedRows>
  revenueProtection: Awaited<ReturnType<typeof runRevenueProtectionReview>>
  summary: RunSoaRevenueProtectionReviewSummary
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
 * Build expected billables and expected rows, then run the existing revenue-protection review.
 */
export async function runSoaRevenueProtectionReview(input: {
  documentId: string | null
  activities: ClassifiedSoaActivity[]
  invoiceRows: InvoiceRow[]
}): Promise<RunSoaRevenueProtectionReviewResult> {
  const { documentId, activities, invoiceRows } = input

  const expectedBillables = buildInitialExpectedBillables({
    documentId,
    activities,
  })

  const expectedRows = toRevenueProtectionExpectedRows({
    documentId,
    rows: expectedBillables.rows,
  })

  const revenueProtection = await runRevenueProtectionReview({
    expectedRows: expectedRows.expectedRows,
    invoiceRows,
  })

  const summary: RunSoaRevenueProtectionReviewSummary = {
    totalActivities: activities.length,
    totalExpectedBillables: expectedBillables.summary.totalRows,
    totalExpectedRows: expectedRows.summary.totalExpectedRows,
    totalInvoiceRows: invoiceRows.length,
    matchedCount: revenueProtection.summary.matchedCount,
    partialMismatchCount: revenueProtection.summary.partialMismatchCount,
    leakageSignalCount: revenueProtection.summary.leakageSignalCount,
    reviewActionCount: revenueProtection.summary.reviewActionCount,
    highPriorityActionCount: revenueProtection.summary.highPriorityActionCount,
  }

  const warnings = mergeWarningsInOrder([
    expectedBillables.warnings,
    expectedRows.warnings,
    revenueProtection.warnings,
  ])

  return {
    expectedBillables,
    expectedRows,
    revenueProtection,
    summary,
    warnings,
  }
}
