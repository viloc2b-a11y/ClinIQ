/**
 * Document Engine v1 — classified SoA → revenue protection → draft event-log rows (no persistence).
 */

import { buildInitialExpectedBillables } from "./build-initial-expected-billables"
import type { ClassifiedCoreSoaActivity } from "./classify-core-soa-activities"
import { toDraftEventLogRows } from "./to-draft-event-log-rows"
import { toRevenueProtectionExpectedRows } from "./to-revenue-protection-expected-rows"
import type { InvoiceRow } from "../matching/match-expected-to-invoice"
import { runRevenueProtectionReview } from "../matching/run-revenue-protection-review"

/** Alias matching spec naming; same shape as {@link ClassifiedCoreSoaActivity}. */
export type ClassifiedSoaActivity = ClassifiedCoreSoaActivity

export type { InvoiceRow }

export type RunSoaReviewToDraftEventsSummary = {
  totalActivities: number
  totalExpectedBillables: number
  totalExpectedRows: number
  totalInvoiceRows: number
  leakageSignalCount: number
  reviewActionCount: number
  draftEventCount: number
  priority1DraftEventCount: number
}

export type RunSoaReviewToDraftEventsResult = {
  expectedBillables: ReturnType<typeof buildInitialExpectedBillables>
  expectedRows: ReturnType<typeof toRevenueProtectionExpectedRows>
  revenueProtection: Awaited<ReturnType<typeof runRevenueProtectionReview>>
  draftEvents: ReturnType<typeof toDraftEventLogRows>
  summary: RunSoaReviewToDraftEventsSummary
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
 * Build expected billables, expected rows, revenue-protection review, then draft event rows.
 */
export async function runSoaReviewToDraftEvents(input: {
  documentId: string | null
  activities: ClassifiedSoaActivity[]
  invoiceRows: InvoiceRow[]
}): Promise<RunSoaReviewToDraftEventsResult> {
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

  const draftEvents = toDraftEventLogRows({
    documentId,
    actions: revenueProtection.actions.actions,
  })

  const summary: RunSoaReviewToDraftEventsSummary = {
    totalActivities: activities.length,
    totalExpectedBillables: expectedBillables.summary.totalRows,
    totalExpectedRows: expectedRows.summary.totalExpectedRows,
    totalInvoiceRows: invoiceRows.length,
    leakageSignalCount: revenueProtection.summary.leakageSignalCount,
    reviewActionCount: revenueProtection.summary.reviewActionCount,
    draftEventCount: draftEvents.summary.totalRows,
    priority1DraftEventCount: draftEvents.summary.priority1Count,
  }

  const warnings = mergeWarningsInOrder([
    expectedBillables.warnings,
    expectedRows.warnings,
    revenueProtection.warnings,
    draftEvents.warnings,
  ])

  return {
    expectedBillables,
    expectedRows,
    revenueProtection,
    draftEvents,
    summary,
    warnings,
  }
}
