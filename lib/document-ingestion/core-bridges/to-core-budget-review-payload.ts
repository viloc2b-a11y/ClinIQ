/**
 * Document Engine v1 — package core budget review rows into a stable budget review payload (no pricing/cost engine).
 */

import type { CoreBudgetReviewRow } from "./to-core-budget-review-rows"

export type { CoreBudgetReviewRow }

const EMPTY_ROWS_WARNING = "No budget review rows provided."
const SOME_NEED_REVIEW_WARNING = "Some budget review rows require review."

const WARN_MISSING_ACTIVITY = "Missing activityName"
const WARN_MISSING_PRICING = "Missing pricing"
const WARN_INCONSISTENT_TOTALS = "Inconsistent totals"
const WARN_LOW_CONFIDENCE = "Low confidence source"

function includesWarning(warnings: readonly string[], message: string): boolean {
  return warnings.includes(message)
}

function countRowsMatching(
  rows: readonly CoreBudgetReviewRow[],
  predicate: (row: CoreBudgetReviewRow) => boolean,
): number {
  let n = 0
  for (const row of rows) {
    if (predicate(row)) n += 1
  }
  return n
}

export type CoreBudgetReviewPayload = {
  documentId: string | null
  rows: CoreBudgetReviewRow[]
  readyRows: CoreBudgetReviewRow[]
  rowsNeedingReview: CoreBudgetReviewRow[]
  summary: {
    totalRows: number
    readyCount: number
    needsReviewCount: number
    missingActivityNameCount: number
    missingPricingCount: number
    inconsistentTotalsCount: number
    lowConfidenceCount: number
  }
  warnings: string[]
}

export function toCoreBudgetReviewPayload(input: {
  documentId?: string
  rows: CoreBudgetReviewRow[]
}): CoreBudgetReviewPayload {
  const documentId = input.documentId ?? null
  const rows = input.rows

  const readyRows = rows.filter((r) => r.reviewStatus === "ready")
  const rowsNeedingReview = rows.filter((r) => r.reviewStatus === "needs_review")

  const totalRows = rows.length
  const readyCount = readyRows.length
  const needsReviewCount = rowsNeedingReview.length

  const missingActivityNameCount = countRowsMatching(
    rows,
    (r) => r.activityName == null || includesWarning(r.reviewWarnings, WARN_MISSING_ACTIVITY),
  )
  const missingPricingCount = countRowsMatching(
    rows,
    (r) => r.flags.missingPricing === true || includesWarning(r.reviewWarnings, WARN_MISSING_PRICING),
  )
  const inconsistentTotalsCount = countRowsMatching(
    rows,
    (r) =>
      r.flags.inconsistentTotals === true || includesWarning(r.reviewWarnings, WARN_INCONSISTENT_TOTALS),
  )
  const lowConfidenceCount = countRowsMatching(
    rows,
    (r) => r.confidence === "low" || includesWarning(r.reviewWarnings, WARN_LOW_CONFIDENCE),
  )

  const warnings: string[] = []
  if (totalRows === 0) {
    warnings.push(EMPTY_ROWS_WARNING)
  }
  if (needsReviewCount > 0) {
    warnings.push(SOME_NEED_REVIEW_WARNING)
  }

  return {
    documentId,
    rows,
    readyRows,
    rowsNeedingReview,
    summary: {
      totalRows,
      readyCount,
      needsReviewCount,
      missingActivityNameCount,
      missingPricingCount,
      inconsistentTotalsCount,
      lowConfidenceCount,
    },
    warnings,
  }
}
