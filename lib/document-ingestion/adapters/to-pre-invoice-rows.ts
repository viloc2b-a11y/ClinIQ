/**
 * Document Engine v1 — pre-invoice review rows (structure + flags only; no claims or matching).
 */

import type { InvoiceCandidateRow } from "../bridge-document-records"

const TOTAL_TOLERANCE = 0.01

export type PreInvoiceRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  needsReview: boolean
  reviewReasons: string[]
  flags: {
    missingVisit: boolean
    missingActivity: boolean
    missingPricing: boolean
    inconsistentTotals: boolean
  }
}

export type PreInvoiceRowsSummary = {
  totalInputCandidates: number
  totalRows: number
  rowsNeedingReview: number
  missingVisit: number
  missingActivity: number
  missingPricing: number
  inconsistentTotals: number
}

export type ToPreInvoiceRowsResult = {
  rows: PreInvoiceRow[]
  warnings: string[]
  summary: PreInvoiceRowsSummary
}

const EMPTY_INPUT_WARNING = "No invoice line candidates were provided."

const MAJORITY_NEED_REVIEW_WARNING =
  "More than half of pre-invoice rows are flagged for review."

export function missingInvoicePricing(unitPrice: number | null, totalPrice: number | null): boolean {
  return unitPrice === null && totalPrice === null
}

export function computeInvoiceInconsistentTotals(
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

export function buildInvoiceReviewReasons(
  candidate: InvoiceCandidateRow,
  inconsistentTotals: boolean,
): string[] {
  const reasons: string[] = []
  if (candidate.visitName === null) {
    reasons.push("Missing visitName")
  }
  if (candidate.activityName === null) {
    reasons.push("Missing activityName")
  }
  if (missingInvoicePricing(candidate.unitPrice, candidate.totalPrice)) {
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

export function computeInvoiceSummary(
  rows: PreInvoiceRow[],
  totalInputCandidates: number,
): PreInvoiceRowsSummary {
  let rowsNeedingReview = 0
  let missingVisit = 0
  let missingActivity = 0
  let missingPricing = 0
  let inconsistentTotals = 0

  for (const r of rows) {
    if (r.needsReview) rowsNeedingReview += 1
    if (r.flags.missingVisit) missingVisit += 1
    if (r.flags.missingActivity) missingActivity += 1
    if (r.flags.missingPricing) missingPricing += 1
    if (r.flags.inconsistentTotals) inconsistentTotals += 1
  }

  return {
    totalInputCandidates,
    totalRows: rows.length,
    rowsNeedingReview,
    missingVisit,
    missingActivity,
    missingPricing,
    inconsistentTotals,
  }
}

/**
 * One pre-invoice row per invoice candidate; deterministic validation flags only.
 */
export function toPreInvoiceRows(input: {
  documentId?: string
  invoiceCandidates: InvoiceCandidateRow[]
}): ToPreInvoiceRowsResult {
  const { invoiceCandidates } = input
  const warnings: string[] = []

  if (invoiceCandidates.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  const rows: PreInvoiceRow[] = invoiceCandidates.map((c) => {
    const inconsistentTotals = computeInvoiceInconsistentTotals(c.quantity, c.unitPrice, c.totalPrice)
    const missingVisit = c.visitName === null
    const missingActivity = c.activityName === null
    const missingPricing = missingInvoicePricing(c.unitPrice, c.totalPrice)
    const reviewReasons = buildInvoiceReviewReasons(c, inconsistentTotals)
    return {
      sourceRecordIndex: c.sourceRecordIndex,
      visitName: c.visitName,
      activityName: c.activityName,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      totalPrice: c.totalPrice,
      notes: c.notes,
      confidence: c.confidence,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      flags: {
        missingVisit,
        missingActivity,
        missingPricing,
        inconsistentTotals,
      },
    }
  })

  const summary = computeInvoiceSummary(rows, invoiceCandidates.length)

  const { totalRows, rowsNeedingReview } = summary
  if (totalRows >= 2 && rowsNeedingReview * 2 > totalRows) {
    warnings.push(MAJORITY_NEED_REVIEW_WARNING)
  }

  return { rows, warnings, summary }
}
