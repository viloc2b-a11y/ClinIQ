/**
 * Document Engine v1 — pre-SoA row adapter (review flags only; no SoA engine or billables).
 */

import type { SoaCandidateRow } from "../bridge-document-records"

export type PreSoaRow = {
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

export type PreSoaRowsSummary = {
  totalInputCandidates: number
  totalRows: number
  rowsNeedingReview: number
  missingVisitName: number
  missingActivityName: number
  missingEconomics: number
}

export type ToPreSoaRowsResult = {
  rows: PreSoaRow[]
  warnings: string[]
  summary: PreSoaRowsSummary
}

const EMPTY_INPUT_WARNING = "No SoA activity candidates were provided."

const MAJORITY_NEED_REVIEW_WARNING =
  "More than half of pre-SoA rows are flagged for review."

function missingEconomics(unitPrice: number | null, totalPrice: number | null): boolean {
  return unitPrice === null && totalPrice === null
}

export function buildReviewReasons(candidate: SoaCandidateRow): string[] {
  const reasons: string[] = []
  if (candidate.visitName === null) {
    reasons.push("Missing visitName")
  }
  if (candidate.activityName === null) {
    reasons.push("Missing activityName")
  }
  if (missingEconomics(candidate.unitPrice, candidate.totalPrice)) {
    reasons.push("Missing economics")
  }
  if (candidate.confidence === "low") {
    reasons.push("Low confidence source")
  }
  return reasons
}

function needsReviewFromReasons(reviewReasons: string[]): boolean {
  return reviewReasons.length > 0
}

export function computeSummary(rows: PreSoaRow[], totalInputCandidates: number): PreSoaRowsSummary {
  let rowsNeedingReview = 0
  let missingVisitName = 0
  let missingActivityName = 0
  let missingEconomicsCount = 0

  for (const r of rows) {
    if (r.needsReview) rowsNeedingReview += 1
    if (r.visitName === null) missingVisitName += 1
    if (r.activityName === null) missingActivityName += 1
    if (missingEconomics(r.unitPrice, r.totalPrice)) missingEconomicsCount += 1
  }

  return {
    totalInputCandidates,
    totalRows: rows.length,
    rowsNeedingReview,
    missingVisitName,
    missingActivityName,
    missingEconomics: missingEconomicsCount,
  }
}

/**
 * One pre-SoA row per SoA candidate; adds deterministic review flags only.
 */
export function toPreSoaRows(input: {
  documentId?: string
  soaCandidates: SoaCandidateRow[]
}): ToPreSoaRowsResult {
  const { soaCandidates } = input
  const warnings: string[] = []

  if (soaCandidates.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  const rows: PreSoaRow[] = soaCandidates.map((c) => {
    const reviewReasons = buildReviewReasons(c)
    return {
      sourceRecordIndex: c.sourceRecordIndex,
      visitName: c.visitName,
      activityName: c.activityName,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      totalPrice: c.totalPrice,
      notes: c.notes,
      confidence: c.confidence,
      needsReview: needsReviewFromReasons(reviewReasons),
      reviewReasons,
    }
  })

  const summary = computeSummary(rows, soaCandidates.length)

  const { totalRows, rowsNeedingReview } = summary
  if (totalRows >= 2 && rowsNeedingReview * 2 > totalRows) {
    warnings.push(MAJORITY_NEED_REVIEW_WARNING)
  }

  return { rows, warnings, summary }
}
