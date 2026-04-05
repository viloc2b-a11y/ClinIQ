/**
 * Document Engine v1 — package core SoA import rows into a stable SoA intake payload (no ClinIQ SoA engine).
 */

import type { CoreSoaImportRow } from "./to-core-soa-import-rows"

export type { CoreSoaImportRow }

const EMPTY_ROWS_WARNING = "No SoA import rows provided."
const SOME_NEED_REVIEW_WARNING = "Some SoA intake rows require review."

const WARN_MISSING_VISIT = "Missing visitName"
const WARN_MISSING_ACTIVITY = "Missing activityName"
const WARN_MISSING_ECONOMICS = "Missing economics"
const WARN_LOW_CONFIDENCE = "Low confidence source"

function includesWarning(warnings: readonly string[], message: string): boolean {
  return warnings.includes(message)
}

function countRowsMatching(
  rows: readonly CoreSoaImportRow[],
  predicate: (row: CoreSoaImportRow) => boolean,
): number {
  let n = 0
  for (const row of rows) {
    if (predicate(row)) n += 1
  }
  return n
}

export type CoreSoaIntakePayload = {
  documentId: string | null
  rows: CoreSoaImportRow[]
  readyRows: CoreSoaImportRow[]
  rowsNeedingReview: CoreSoaImportRow[]
  summary: {
    totalRows: number
    readyCount: number
    needsReviewCount: number
    missingVisitNameCount: number
    missingActivityNameCount: number
    missingEconomicsCount: number
    lowConfidenceCount: number
  }
  warnings: string[]
}

export function toCoreSoaIntakePayload(input: {
  documentId?: string
  rows: CoreSoaImportRow[]
}): CoreSoaIntakePayload {
  const documentId = input.documentId ?? null
  const rows = input.rows

  const readyRows = rows.filter((r) => r.importStatus === "ready")
  const rowsNeedingReview = rows.filter((r) => r.importStatus === "needs_review")

  const totalRows = rows.length
  const readyCount = readyRows.length
  const needsReviewCount = rowsNeedingReview.length

  const missingVisitNameCount = countRowsMatching(
    rows,
    (r) => r.visitName == null || includesWarning(r.importWarnings, WARN_MISSING_VISIT),
  )
  const missingActivityNameCount = countRowsMatching(
    rows,
    (r) => r.activityName == null || includesWarning(r.importWarnings, WARN_MISSING_ACTIVITY),
  )
  const missingEconomicsCount = countRowsMatching(
    rows,
    (r) =>
      (r.unitPrice === null && r.totalPrice === null) ||
      includesWarning(r.importWarnings, WARN_MISSING_ECONOMICS),
  )
  const lowConfidenceCount = countRowsMatching(
    rows,
    (r) => r.confidence === "low" || includesWarning(r.importWarnings, WARN_LOW_CONFIDENCE),
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
      missingVisitNameCount,
      missingActivityNameCount,
      missingEconomicsCount,
      lowConfidenceCount,
    },
    warnings,
  }
}
