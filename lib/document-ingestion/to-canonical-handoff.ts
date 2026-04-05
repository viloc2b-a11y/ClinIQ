/**
 * Document Engine v1 — stable handoff view for downstream ClinIQ modules (no mapping to engine yet).
 */

import type { ParsedDocument, ParsedDocumentRecord, ParsedFieldConfidence } from "./types"

export type CanonicalHandoffSummary = {
  totalRecords: number
  /** Counts per `ParsedDocumentRecord.kind`, keys sorted alphabetically for deterministic serialization. */
  byType: Record<string, number>
  /** True if any {@link ParsedField} on any record has `confidence === "low"`. */
  hasLowConfidence: boolean
  hasWarnings: boolean
}

export type CanonicalHandoff = {
  records: ParsedDocumentRecord[]
  warnings: string[]
  summary: CanonicalHandoffSummary
}

function fieldIsLow(f: { confidence: ParsedFieldConfidence } | undefined): boolean {
  return f !== undefined && f.confidence === ("low" satisfies ParsedFieldConfidence)
}

/** Returns true if any structured field on the record uses low confidence. */
export function recordHasLowConfidenceField(record: ParsedDocumentRecord): boolean {
  switch (record.kind) {
    case "soa_activity":
      return fieldIsLow(record.quantity) || fieldIsLow(record.unitAmount)
    case "budget_line":
      return (
        fieldIsLow(record.expectedQuantity) ||
        fieldIsLow(record.unitPrice) ||
        fieldIsLow(record.expectedAmount)
      )
    case "invoice_line":
      return (
        fieldIsLow(record.quantity) ||
        fieldIsLow(record.unitPrice) ||
        fieldIsLow(record.lineAmount) ||
        fieldIsLow(record.taxAmount)
      )
    case "contract_clause":
      return fieldIsLow(record.booleanValue)
    case "visit_schedule":
      return (
        fieldIsLow(record.visitNumber) ||
        fieldIsLow(record.targetStudyDay) ||
        fieldIsLow(record.windowStartDay) ||
        fieldIsLow(record.windowEndDay)
      )
  }
}

function buildByTypeSorted(records: ParsedDocumentRecord[]): Record<string, number> {
  const counts = new Map<string, number>()
  for (const r of records) {
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
  }
  const keys = [...counts.keys()].sort((a, b) => a.localeCompare(b))
  const byType: Record<string, number> = {}
  for (const k of keys) {
    byType[k] = counts.get(k) ?? 0
  }
  return byType
}

/**
 * Pass-through handoff: same records and warnings, plus a deterministic summary for routing and QA.
 * Does not filter, enrich, or reinterpret business meaning.
 */
export function toCanonicalHandoff(doc: ParsedDocument): CanonicalHandoff {
  const records = doc.records
  const warnings = doc.warnings
  const hasLowConfidence = records.some(recordHasLowConfidenceField)
  return {
    records,
    warnings,
    summary: {
      totalRecords: records.length,
      byType: buildByTypeSorted(records),
      hasLowConfidence,
      hasWarnings: warnings.length > 0,
    },
  }
}
