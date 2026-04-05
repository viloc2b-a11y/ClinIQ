/**
 * Document Engine v1 — classified SoA activities → initial expected billable rows (no ledger / claims / AI).
 */

import type { ClassifiedCoreSoaActivity } from "./classify-core-soa-activities"

/** Alias matching spec naming; same shape as {@link ClassifiedCoreSoaActivity}. */
export type ClassifiedSoaActivity = ClassifiedCoreSoaActivity

const WARN_MISSING_VISIT = "Missing visitName"
const WARN_MISSING_ACTIVITY = "Missing activityName"
const WARN_MISSING_QUANTITY = "Missing quantity"
const WARN_MISSING_UNIT_PRICE = "Missing unitPrice"
const WARN_MISSING_AMOUNT = "Missing expected amount"
const WARN_LOW_CONFIDENCE = "Low confidence source"

const EMPTY_INPUT_WARNING = "No classified SoA activities provided."
const SOME_NEED_REVIEW_WARNING = "Some expected billables require review."

export type InitialExpectedBillableRow = {
  expectedBillableId: string
  activityId: string
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  expectedAmount: number | null
  sourceRecordIndex: number
  confidence: string | null
  generationStatus: "ready" | "needs_review"
  generationWarnings: string[]
}

export type BuildInitialExpectedBillablesResult = {
  documentId: string | null
  rows: InitialExpectedBillableRow[]
  summary: {
    totalActivities: number
    totalRows: number
    readyCount: number
    needsReviewCount: number
    missingVisitNameCount: number
    missingActivityNameCount: number
    missingUnitPriceCount: number
    missingQuantityCount: number
    missingExpectedAmountCount: number
    lowConfidenceCount: number
  }
  warnings: string[]
}

function hasWarning(warnings: readonly string[], message: string): boolean {
  return warnings.includes(message)
}

function appendGenerationWarnings(
  classificationReasons: readonly string[],
  a: ClassifiedSoaActivity,
  expectedAmount: number | null,
): string[] {
  const out = [...classificationReasons]
  const has = (msg: string) => hasWarning(out, msg)
  if (a.visitName == null && !has(WARN_MISSING_VISIT)) out.push(WARN_MISSING_VISIT)
  if (a.activityName == null && !has(WARN_MISSING_ACTIVITY)) out.push(WARN_MISSING_ACTIVITY)
  if (a.quantity == null && !has(WARN_MISSING_QUANTITY)) out.push(WARN_MISSING_QUANTITY)
  if (a.unitPrice == null && !has(WARN_MISSING_UNIT_PRICE)) out.push(WARN_MISSING_UNIT_PRICE)
  if (expectedAmount == null && !has(WARN_MISSING_AMOUNT)) out.push(WARN_MISSING_AMOUNT)
  if (a.confidence === "low" && !has(WARN_LOW_CONFIDENCE)) out.push(WARN_LOW_CONFIDENCE)
  return out
}

function computeExpectedAmount(quantity: number | null, unitPrice: number | null): number | null {
  if (quantity != null && unitPrice != null) return quantity * unitPrice
  return null
}

function computeGenerationStatus(
  a: ClassifiedSoaActivity,
  expectedAmount: number | null,
): InitialExpectedBillableRow["generationStatus"] {
  if (a.classificationStatus === "needs_review") return "needs_review"
  if (a.visitName == null) return "needs_review"
  if (a.activityName == null) return "needs_review"
  if (a.quantity == null) return "needs_review"
  if (a.unitPrice == null) return "needs_review"
  if (expectedAmount == null) return "needs_review"
  if (a.confidence === "low") return "needs_review"
  return "ready"
}

export function buildInitialExpectedBillables(input: {
  documentId: string | null
  activities: ClassifiedSoaActivity[]
}): BuildInitialExpectedBillablesResult {
  const { documentId, activities } = input

  const rows: InitialExpectedBillableRow[] = activities.map((a) => {
    const expectedAmount = computeExpectedAmount(a.quantity, a.unitPrice)
    const generationWarnings = appendGenerationWarnings(a.classificationReasons, a, expectedAmount)
    const generationStatus = computeGenerationStatus(a, expectedAmount)

    return {
      expectedBillableId: `exp::${a.activityId}`,
      activityId: a.activityId,
      visitName: a.visitName,
      activityName: a.activityName,
      quantity: a.quantity,
      unitPrice: a.unitPrice,
      expectedAmount,
      sourceRecordIndex: a.sourceRecordIndex,
      confidence: a.confidence,
      generationStatus,
      generationWarnings,
    }
  })

  let readyCount = 0
  let needsReviewCount = 0
  let missingVisitNameCount = 0
  let missingActivityNameCount = 0
  let missingUnitPriceCount = 0
  let missingQuantityCount = 0
  let missingExpectedAmountCount = 0
  let lowConfidenceCount = 0

  for (const r of rows) {
    if (r.generationStatus === "ready") readyCount += 1
    else needsReviewCount += 1
    if (r.visitName == null || hasWarning(r.generationWarnings, WARN_MISSING_VISIT)) {
      missingVisitNameCount += 1
    }
    if (r.activityName == null || hasWarning(r.generationWarnings, WARN_MISSING_ACTIVITY)) {
      missingActivityNameCount += 1
    }
    if (r.unitPrice == null || hasWarning(r.generationWarnings, WARN_MISSING_UNIT_PRICE)) {
      missingUnitPriceCount += 1
    }
    if (r.quantity == null || hasWarning(r.generationWarnings, WARN_MISSING_QUANTITY)) {
      missingQuantityCount += 1
    }
    if (r.expectedAmount == null || hasWarning(r.generationWarnings, WARN_MISSING_AMOUNT)) {
      missingExpectedAmountCount += 1
    }
    if (r.confidence === "low" || hasWarning(r.generationWarnings, WARN_LOW_CONFIDENCE)) {
      lowConfidenceCount += 1
    }
  }

  const warnings: string[] = []
  if (activities.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }
  if (needsReviewCount > 0) {
    warnings.push(SOME_NEED_REVIEW_WARNING)
  }

  return {
    documentId,
    rows,
    summary: {
      totalActivities: activities.length,
      totalRows: rows.length,
      readyCount,
      needsReviewCount,
      missingVisitNameCount,
      missingActivityNameCount,
      missingUnitPriceCount,
      missingQuantityCount,
      missingExpectedAmountCount,
      lowConfidenceCount,
    },
    warnings,
  }
}
