/**
 * Document Engine v1 — deterministic SoA activity classification (no AI / ontology / expected billables).
 */

import type { CoreSoaStructuredActivity } from "./to-core-soa-structured-input"

export type { CoreSoaStructuredActivity }

const REASON_UPSTREAM_REVIEW = "Marked for review upstream"
const REASON_MISSING_VISIT = "Missing visitName"
const REASON_MISSING_ACTIVITY = "Missing activityName"
const REASON_MISSING_ECONOMICS = "Missing economics"
const REASON_LOW_CONFIDENCE = "Low confidence source"

const EMPTY_INPUT_WARNING = "No SoA activities provided for classification."
const SOME_NEED_REVIEW_WARNING = "Some SoA activities require review."

export type ClassifiedCoreSoaActivity = CoreSoaStructuredActivity & {
  classificationStatus: "classified" | "needs_review"
  classificationReasons: string[]
}

export type ClassifyCoreSoaActivitiesResult = {
  documentId: string | null
  activities: ClassifiedCoreSoaActivity[]
  summary: {
    totalActivities: number
    classifiedCount: number
    needsReviewCount: number
    missingVisitNameCount: number
    missingActivityNameCount: number
    missingEconomicsCount: number
    lowConfidenceCount: number
  }
  warnings: string[]
}

function buildClassificationReasons(a: CoreSoaStructuredActivity): string[] {
  const reasons: string[] = []
  if (a.needsReview) reasons.push(REASON_UPSTREAM_REVIEW)
  if (a.visitName == null) reasons.push(REASON_MISSING_VISIT)
  if (a.activityName == null) reasons.push(REASON_MISSING_ACTIVITY)
  if (a.quantity == null && a.unitPrice == null && a.totalPrice == null) {
    reasons.push(REASON_MISSING_ECONOMICS)
  }
  if (a.confidence === "low") reasons.push(REASON_LOW_CONFIDENCE)
  return reasons
}

export function classifyCoreSoaActivities(input: {
  documentId: string | null
  activities: CoreSoaStructuredActivity[]
}): ClassifyCoreSoaActivitiesResult {
  const { documentId, activities } = input

  const out: ClassifiedCoreSoaActivity[] = activities.map((a) => {
    const classificationReasons = buildClassificationReasons(a)
    const classificationStatus: ClassifiedCoreSoaActivity["classificationStatus"] =
      classificationReasons.length > 0 ? "needs_review" : "classified"
    return {
      activityId: a.activityId,
      visitName: a.visitName,
      activityName: a.activityName,
      quantity: a.quantity,
      unitPrice: a.unitPrice,
      totalPrice: a.totalPrice,
      sourceRecordIndex: a.sourceRecordIndex,
      confidence: a.confidence,
      needsReview: a.needsReview,
      classificationStatus,
      classificationReasons,
    }
  })

  let classifiedCount = 0
  let needsReviewCount = 0
  let missingVisitNameCount = 0
  let missingActivityNameCount = 0
  let missingEconomicsCount = 0
  let lowConfidenceCount = 0

  for (const a of activities) {
    if (a.visitName == null) missingVisitNameCount += 1
    if (a.activityName == null) missingActivityNameCount += 1
    if (a.quantity == null && a.unitPrice == null && a.totalPrice == null) {
      missingEconomicsCount += 1
    }
    if (a.confidence === "low") lowConfidenceCount += 1
  }

  for (const row of out) {
    if (row.classificationStatus === "classified") classifiedCount += 1
    else needsReviewCount += 1
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
    activities: out,
    summary: {
      totalActivities: activities.length,
      classifiedCount,
      needsReviewCount,
      missingVisitNameCount,
      missingActivityNameCount,
      missingEconomicsCount,
      lowConfidenceCount,
    },
    warnings,
  }
}
