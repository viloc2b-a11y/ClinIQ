/**
 * Document Engine v1 — pre-invoice review rows → core-ready invoice review shape (no claims engine).
 */

import type { PreInvoiceRow } from "../adapters/to-pre-invoice-rows"

export type CoreInvoiceReviewRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  reviewStatus: "ready" | "needs_review"
  reviewWarnings: string[]
  flags: {
    missingVisit: boolean
    missingActivity: boolean
    missingPricing: boolean
    inconsistentTotals: boolean
  }
}

export type CoreInvoiceReviewSummary = {
  totalInputRows: number
  totalOutputRows: number
  readyCount: number
  needsReviewCount: number
  missingVisitCount: number
  missingActivityCount: number
  missingPricingCount: number
  inconsistentTotalsCount: number
}

export type ToCoreInvoiceReviewRowsResult = {
  rows: CoreInvoiceReviewRow[]
  summary: CoreInvoiceReviewSummary
  warnings: string[]
}

const EMPTY_INPUT_WARNING = "No pre-invoice rows provided."

/**
 * One core invoice review row per pre-invoice row; status from {@link PreInvoiceRow.needsReview}; flags copied.
 */
export function toCoreInvoiceReviewRows(input: {
  documentId?: string
  rows: PreInvoiceRow[]
}): ToCoreInvoiceReviewRowsResult {
  const { rows } = input
  const warnings: string[] = []
  if (rows.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  const out: CoreInvoiceReviewRow[] = rows.map((r) => ({
    sourceRecordIndex: r.sourceRecordIndex,
    visitName: r.visitName,
    activityName: r.activityName,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    totalPrice: r.totalPrice,
    notes: r.notes,
    confidence: r.confidence,
    reviewStatus: r.needsReview ? "needs_review" : "ready",
    reviewWarnings: [...r.reviewReasons],
    flags: {
      missingVisit: r.flags.missingVisit,
      missingActivity: r.flags.missingActivity,
      missingPricing: r.flags.missingPricing,
      inconsistentTotals: r.flags.inconsistentTotals,
    },
  }))

  let readyCount = 0
  let needsReviewCount = 0
  let missingVisitCount = 0
  let missingActivityCount = 0
  let missingPricingCount = 0
  let inconsistentTotalsCount = 0
  for (const r of out) {
    if (r.reviewStatus === "ready") readyCount += 1
    else needsReviewCount += 1
    if (r.flags.missingVisit) missingVisitCount += 1
    if (r.flags.missingActivity) missingActivityCount += 1
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
      missingVisitCount,
      missingActivityCount,
      missingPricingCount,
      inconsistentTotalsCount,
    },
    warnings,
  }
}
