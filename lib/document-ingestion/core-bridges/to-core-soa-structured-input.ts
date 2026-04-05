/**
 * Document Engine v1 — SoA intake-shaped rows → core-ready structured activities (no ontology / expected billables).
 */

import type { CoreSoaImportRow } from "./to-core-soa-import-rows"

export type { CoreSoaImportRow }

const EMPTY_INPUT_WARNING = "No SoA structured input generated."
const SOME_NEED_REVIEW_WARNING = "Some SoA activities require review."

export type CoreSoaStructuredActivity = {
  activityId: string
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  sourceRecordIndex: number
  confidence: string | null
  needsReview: boolean
}

export type CoreSoaStructuredInputResult = {
  documentId: string | null
  activities: CoreSoaStructuredActivity[]
  summary: {
    totalActivities: number
    readyActivities: number
    needsReviewActivities: number
  }
  warnings: string[]
}

export function toCoreSoaStructuredInput(input: {
  documentId: string | null
  rows: CoreSoaImportRow[]
}): CoreSoaStructuredInputResult {
  const { documentId, rows } = input

  const activities: CoreSoaStructuredActivity[] = rows.map((r) => ({
    activityId: `act::${r.sourceRecordIndex}`,
    visitName: r.visitName,
    activityName: r.activityName,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    totalPrice: r.totalPrice,
    sourceRecordIndex: r.sourceRecordIndex,
    confidence: r.confidence,
    needsReview: r.importStatus === "needs_review",
  }))

  let readyActivities = 0
  let needsReviewActivities = 0
  for (const r of rows) {
    if (r.importStatus === "ready") readyActivities += 1
    else needsReviewActivities += 1
  }

  const warnings: string[] = []
  if (rows.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }
  if (needsReviewActivities > 0) {
    warnings.push(SOME_NEED_REVIEW_WARNING)
  }

  return {
    documentId,
    activities,
    summary: {
      totalActivities: rows.length,
      readyActivities,
      needsReviewActivities,
    },
    warnings,
  }
}
