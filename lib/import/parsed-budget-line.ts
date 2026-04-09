/**
 * Canonical review model for multiformat budget import (Excel / PDF / Word).
 * All parsers normalize into this shape before human review and Budget Gap mapping.
 */

export type ImportSourceType = "excel" | "pdf" | "word"

export type ImportIntent =
  | "sponsor_budget"
  | "site_internal_budget"
  | "contract_financial"

export type ParsedBudgetLineConfidence = "high" | "medium" | "low"

export type ParsedBudgetLine = {
  lineId: string
  sourceType: ImportSourceType
  category: string | null
  itemDescription: string
  unitType: string | null
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  visitName: string | null
  notes: string | null
  confidence: ParsedBudgetLineConfidence
  warnings: string[]
  rawSourceRef?: string
}

export const IMPORT_INTENT_LABELS: Record<ImportIntent, string> = {
  sponsor_budget: "Sponsor budget",
  site_internal_budget: "Site / internal budget",
  contract_financial: "Contract / financial source",
}

export function isImportIntent(s: string): s is ImportIntent {
  return (
    s === "sponsor_budget" ||
    s === "site_internal_budget" ||
    s === "contract_financial"
  )
}
