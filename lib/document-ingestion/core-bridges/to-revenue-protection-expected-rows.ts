/**
 * Document Engine v1 — initial expected billables → revenue-protection expectedRows shape (no matching logic).
 */

import type { InitialExpectedBillableRow } from "./build-initial-expected-billables"

export type { InitialExpectedBillableRow }

const WARN_MISSING_VISIT = "Missing visitName"
const WARN_MISSING_ACTIVITY = "Missing activityName"
const WARN_MISSING_QUANTITY = "Missing quantity"
const WARN_MISSING_UNIT_PRICE = "Missing unitPrice"
const WARN_MISSING_AMOUNT = "Missing expected amount"
const WARN_LOW_CONFIDENCE = "Low confidence source"

const EMPTY_INPUT_WARNING = "No initial expected billables provided."
const SOME_NEED_REVIEW_WARNING =
  "Some expected rows require review before revenue protection matching."

export type RevenueProtectionExpectedRow = {
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
}

export type ToRevenueProtectionExpectedRowsResult = {
  documentId: string | null
  expectedRows: RevenueProtectionExpectedRow[]
  summary: {
    totalInputRows: number
    totalExpectedRows: number
    readyCount: number
    needsReviewCount: number
    missingVisitNameCount: number
    missingActivityNameCount: number
    missingQuantityCount: number
    missingUnitPriceCount: number
    missingExpectedAmountCount: number
    lowConfidenceCount: number
  }
  warnings: string[]
}

function hasReason(reasons: readonly string[], message: string): boolean {
  return reasons.includes(message)
}

export function toRevenueProtectionExpectedRows(input: {
  documentId: string | null
  rows: InitialExpectedBillableRow[]
}): ToRevenueProtectionExpectedRowsResult {
  const { documentId, rows } = input

  const expectedRows: RevenueProtectionExpectedRow[] = rows.map((r) => ({
    sourceRecordIndex: r.sourceRecordIndex,
    visitName: r.visitName,
    activityName: r.activityName,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    totalPrice: r.expectedAmount,
    notes: null,
    confidence: r.confidence,
    needsReview: r.generationStatus === "needs_review",
    reviewReasons: [...r.generationWarnings],
  }))

  let readyCount = 0
  let needsReviewCount = 0
  let missingVisitNameCount = 0
  let missingActivityNameCount = 0
  let missingQuantityCount = 0
  let missingUnitPriceCount = 0
  let missingExpectedAmountCount = 0
  let lowConfidenceCount = 0

  for (const r of expectedRows) {
    if (r.needsReview) needsReviewCount += 1
    else readyCount += 1

    if (r.visitName == null || hasReason(r.reviewReasons, WARN_MISSING_VISIT)) {
      missingVisitNameCount += 1
    }
    if (r.activityName == null || hasReason(r.reviewReasons, WARN_MISSING_ACTIVITY)) {
      missingActivityNameCount += 1
    }
    if (r.quantity == null || hasReason(r.reviewReasons, WARN_MISSING_QUANTITY)) {
      missingQuantityCount += 1
    }
    if (r.unitPrice == null || hasReason(r.reviewReasons, WARN_MISSING_UNIT_PRICE)) {
      missingUnitPriceCount += 1
    }
    if (r.totalPrice == null || hasReason(r.reviewReasons, WARN_MISSING_AMOUNT)) {
      missingExpectedAmountCount += 1
    }
    if (r.confidence === "low" || hasReason(r.reviewReasons, WARN_LOW_CONFIDENCE)) {
      lowConfidenceCount += 1
    }
  }

  const warnings: string[] = []
  if (rows.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }
  if (needsReviewCount > 0) {
    warnings.push(SOME_NEED_REVIEW_WARNING)
  }

  return {
    documentId,
    expectedRows,
    summary: {
      totalInputRows: rows.length,
      totalExpectedRows: expectedRows.length,
      readyCount,
      needsReviewCount,
      missingVisitNameCount,
      missingActivityNameCount,
      missingQuantityCount,
      missingUnitPriceCount,
      missingExpectedAmountCount,
      lowConfidenceCount,
    },
    warnings,
  }
}
