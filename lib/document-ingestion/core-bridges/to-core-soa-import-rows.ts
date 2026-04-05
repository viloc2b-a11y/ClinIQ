/**
 * Document Engine v1 — pre-SoA review rows → core-ready SoA import shape (no SoA engine).
 */

import type { PreSoaRow } from "../adapters/to-pre-soa-rows"

export type CoreSoaImportRow = {
  sourceRecordIndex: number
  visitName: string | null
  activityName: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  notes: string | null
  confidence: string | null
  importStatus: "ready" | "needs_review"
  importWarnings: string[]
}

export type CoreSoaImportSummary = {
  totalInputRows: number
  totalOutputRows: number
  readyCount: number
  needsReviewCount: number
}

export type ToCoreSoaImportRowsResult = {
  rows: CoreSoaImportRow[]
  summary: CoreSoaImportSummary
  warnings: string[]
}

const EMPTY_INPUT_WARNING = "No pre-SoA rows provided."

/**
 * One core import row per pre-SoA row; import status derived from {@link PreSoaRow.needsReview} only.
 */
export function toCoreSoaImportRows(input: {
  documentId?: string
  rows: PreSoaRow[]
}): ToCoreSoaImportRowsResult {
  const { rows } = input
  const warnings: string[] = []
  if (rows.length === 0) {
    warnings.push(EMPTY_INPUT_WARNING)
  }

  const out: CoreSoaImportRow[] = rows.map((r) => ({
    sourceRecordIndex: r.sourceRecordIndex,
    visitName: r.visitName,
    activityName: r.activityName,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    totalPrice: r.totalPrice,
    notes: r.notes,
    confidence: r.confidence,
    importStatus: r.needsReview ? "needs_review" : "ready",
    importWarnings: [...r.reviewReasons],
  }))

  let readyCount = 0
  let needsReviewCount = 0
  for (const r of out) {
    if (r.importStatus === "ready") readyCount += 1
    else needsReviewCount += 1
  }

  return {
    rows: out,
    summary: {
      totalInputRows: rows.length,
      totalOutputRows: out.length,
      readyCount,
      needsReviewCount,
    },
    warnings,
  }
}
