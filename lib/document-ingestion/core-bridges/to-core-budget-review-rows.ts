/**
 * Document Engine v1 — pre-budget review rows → core-ready budget review shape (no cost/margin engine).
 */

import type { PreBudgetRow } from "../adapters/to-pre-budget-rows"

export type CoreBudgetReviewRow = {
  sourceRecordIndex: number
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  reviewStatus: "ready" | "needs_review"
  reviewWarnings: string[]
  flags: {
    missingPricing: boolean
    inconsistentTotals: boolean
  }
}

export type CoreBudgetReviewSummary = {
  totalInputRows: number
  totalOutputRows: number
  readyCount: number
  needsReviewCount: number
  missingPricingCount: number
  inconsistentTotalsCount: number
}

export type ToCoreBudgetReviewRowsResult = {
  rows: CoreBudgetReviewRow[]
  summary: CoreBudgetReviewSummary
  warnings: string[]
}

const EMPTY_INPUT_WARNING = "No pre-budget rows provided."

/**
 * One core budget review row per pre-budget row; status from {@link PreBudgetRow.needsReview}; flags copied.
 */
export function toCoreBudgetReviewRows(input: {
  documentId?: string
  rows: PreBudgetRow[]
}): ToCoreBudgetReviewRowsResult {
  const { rows } = input
  const warnings: string[] = []
  if (rows.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  const out: CoreBudgetReviewRow[] = rows.map((r) => ({
    sourceRecordIndex: r.sourceRecordIndex,
    activityName: r.activityName,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    totalPrice: r.totalPrice,
    notes: r.notes,
    confidence: r.confidence,
    reviewStatus: r.needsReview ? "needs_review" : "ready",
    reviewWarnings: [...r.reviewReasons],
    flags: {
      missingPricing: r.flags.missingPricing,
      inconsistentTotals: r.flags.inconsistentTotals,
    },
  }))

  let readyCount = 0
  let needsReviewCount = 0
  let missingPricingCount = 0
  let inconsistentTotalsCount = 0
  for (const r of out) {
    if (r.reviewStatus === "ready") readyCount += 1
    else needsReviewCount += 1
    if (r.flags.missingPricing) missingPricingCount += 1
    if (r.flags.inconsistentTotals) inconsistentTotalsCount += 1
  }

  return {
    rows: out,
    summary: {
      totalInputRows: rows.length,
      totalOutputRows: out.length,
      readyCount,
      needsReviewCount,
      missingPricingCount,
      inconsistentTotalsCount,
    },
    warnings,
  }
}
