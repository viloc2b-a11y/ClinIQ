/**
 * Document Engine v1 — pre-budget review rows (structure + flags only; no margins or cost engine).
 */

import type { BudgetCandidateRow } from "../bridge-document-records"

const TOTAL_TOLERANCE = 0.01

export type PreBudgetRow = {
  sourceRecordIndex: number
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  needsReview: boolean
  reviewReasons: string[]
  flags: {
    missingPricing: boolean
    inconsistentTotals: boolean
  }
}

export type PreBudgetRowsSummary = {
  totalInputCandidates: number
  totalRows: number
  rowsNeedingReview: number
  missingActivityName: number
  missingPricing: number
  inconsistentTotals: number
}

export type ToPreBudgetRowsResult = {
  rows: PreBudgetRow[]
  warnings: string[]
  summary: PreBudgetRowsSummary
}

const EMPTY_INPUT_WARNING = "No budget line candidates were provided."

const MAJORITY_INCONSISTENT_TOTALS_WARNING =
  "More than half of pre-budget rows have inconsistent quantity × unit vs total."

export function missingBudgetPricing(unitPrice: number | null, totalPrice: number | null): boolean {
  return unitPrice === null && totalPrice === null
}

export function computeInconsistentTotals(
  quantity: number | null,
  unitPrice: number | null,
  totalPrice: number | null,
): boolean {
  if (quantity === null || unitPrice === null || totalPrice === null) return false
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice) || !Number.isFinite(totalPrice)) {
    return false
  }
  const expected = quantity * unitPrice
  return Math.abs(expected - totalPrice) > TOTAL_TOLERANCE
}

export function buildReviewReasons(
  candidate: BudgetCandidateRow,
  inconsistentTotals: boolean,
): string[] {
  const reasons: string[] = []
  if (candidate.activityName === null) {
    reasons.push("Missing activityName")
  }
  if (missingBudgetPricing(candidate.unitPrice, candidate.totalPrice)) {
    reasons.push("Missing pricing")
  }
  if (inconsistentTotals) {
    reasons.push("Inconsistent totals")
  }
  if (candidate.confidence === "low") {
    reasons.push("Low confidence source")
  }
  return reasons
}

export function computeSummary(rows: PreBudgetRow[], totalInputCandidates: number): PreBudgetRowsSummary {
  let rowsNeedingReview = 0
  let missingActivityName = 0
  let missingPricing = 0
  let inconsistentTotals = 0

  for (const r of rows) {
    if (r.needsReview) rowsNeedingReview += 1
    if (r.activityName === null) missingActivityName += 1
    if (r.flags.missingPricing) missingPricing += 1
    if (r.flags.inconsistentTotals) inconsistentTotals += 1
  }

  return {
    totalInputCandidates,
    totalRows: rows.length,
    rowsNeedingReview,
    missingActivityName,
    missingPricing,
    inconsistentTotals,
  }
}

/**
 * One pre-budget row per budget candidate; deterministic review flags only.
 */
export function toPreBudgetRows(input: {
  documentId?: string
  budgetCandidates: BudgetCandidateRow[]
}): ToPreBudgetRowsResult {
  const { budgetCandidates } = input
  const warnings: string[] = []

  if (budgetCandidates.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  const rows: PreBudgetRow[] = budgetCandidates.map((c) => {
    const inconsistentTotals = computeInconsistentTotals(c.quantity, c.unitPrice, c.totalPrice)
    const missingPricing = missingBudgetPricing(c.unitPrice, c.totalPrice)
    const reviewReasons = buildReviewReasons(c, inconsistentTotals)
    return {
      sourceRecordIndex: c.sourceRecordIndex,
      activityName: c.activityName,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      totalPrice: c.totalPrice,
      notes: c.notes,
      confidence: c.confidence,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      flags: {
        missingPricing,
        inconsistentTotals,
      },
    }
  })

  const summary = computeSummary(rows, budgetCandidates.length)

  const { totalRows } = summary
  const inconsistentRowCount = rows.filter((r) => r.flags.inconsistentTotals).length
  if (totalRows >= 2 && inconsistentRowCount * 2 > totalRows) {
    warnings.push(MAJORITY_INCONSISTENT_TOTALS_WARNING)
  }

  return { rows, warnings, summary }
}
