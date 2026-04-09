import { budgetGapResultToNegotiationEngineInput } from "./negotiation-input"
import type { BudgetGapAnalysisJsonDocument } from "./export-budget-gap-json"
import type { BudgetGapLine, CompareBudgetInput, CompareBudgetResult } from "./types"

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const CSV_HEADERS = [
  "id",
  "lineCode",
  "category",
  "label",
  "visitName",
  "quantity",
  "unit",
  "internalUnitCost",
  "internalTotal",
  "sponsorUnitOffer",
  "sponsorTotalOffer",
  "gapAmount",
  "gapPercent",
  "status",
  "notes",
] as const

/**
 * RFC 4180-style single sheet for spreadsheets.
 */
export function gapLinesToCsv(gapLines: BudgetGapLine[]): string {
  const headerRow = CSV_HEADERS.join(",")
  const dataRows = gapLines.map((row) =>
    [
      row.id,
      row.lineCode,
      row.category,
      row.label,
      row.visitName,
      String(row.quantity),
      row.unit,
      String(row.internalUnitCost),
      String(row.internalTotal),
      String(row.sponsorUnitOffer),
      String(row.sponsorTotalOffer),
      String(row.gapAmount),
      String(row.gapPercent),
      row.status,
      row.notes,
    ]
      .map(csvEscapeCell)
      .join(","),
  )
  return [headerRow, ...dataRows].join("\n")
}

export type BudgetGapAnalysisExport = {
  schemaVersion: "1.0"
  exportedAt: string
  studyMeta: CompareBudgetInput["studyMeta"]
  compareInput?: CompareBudgetInput
  result: CompareBudgetResult
  negotiationEngineInput: ReturnType<typeof budgetGapResultToNegotiationEngineInput>
}

/**
 * Full local snapshot for audit, re-run, or hand-off to Module 4.
 */
export function buildBudgetGapAnalysisExport(
  result: CompareBudgetResult,
  studyMeta: CompareBudgetInput["studyMeta"],
  compareInput?: CompareBudgetInput,
  options?: { exportedAt?: string },
): BudgetGapAnalysisExport {
  const exportedAt = options?.exportedAt ?? new Date().toISOString()
  return {
    schemaVersion: "1.0",
    exportedAt,
    studyMeta,
    ...(compareInput ? { compareInput } : {}),
    result,
    negotiationEngineInput: budgetGapResultToNegotiationEngineInput(
      result,
      studyMeta,
      { generatedAt: exportedAt },
    ),
  }
}

const BUDGET_GAP_ANALYSIS_DOC_CSV_HEADERS = [
  "line_code",
  "category",
  "label",
  "visit_name",
  "status",
  "internal_total",
  "sponsor_total_offer",
  "gap_amount",
  "notes_or_rationale",
] as const

function rowFromAnalysisGapLine(
  l: BudgetGapAnalysisJsonDocument["gapLines"][number],
): string[] {
  return [
    l.lineCode,
    l.category,
    l.label,
    l.visitName,
    l.status,
    String(l.internalTotal),
    String(l.sponsorTotalOffer),
    String(l.gapAmount),
    l.notes ?? "",
  ].map(csvEscapeCell)
}

function rowFromAnalysisMissing(
  m: BudgetGapAnalysisJsonDocument["missingInvoiceables"][number],
): string[] {
  return [
    m.lineCode,
    m.category,
    m.label,
    m.visitName,
    m.status,
    String(m.internalTotal),
    "0",
    String(m.gapAmount),
    m.notes ?? "",
  ].map(csvEscapeCell)
}

/**
 * One row per `gapLines` entry, then one per `missingInvoiceable` (RFC 4180-style),
 * from the canonical budget-gap JSON document shape.
 */
export function budgetGapAnalysisToCsv(doc: BudgetGapAnalysisJsonDocument): string {
  const headerRow = BUDGET_GAP_ANALYSIS_DOC_CSV_HEADERS.join(",")
  const dataRows = [
    ...doc.gapLines.map((l) => rowFromAnalysisGapLine(l).join(",")),
    ...doc.missingInvoiceables.map((m) => rowFromAnalysisMissing(m).join(",")),
  ]
  return [headerRow, ...dataRows].join("\n")
}

export type BudgetGapAnalysisCsvColumn = (typeof BUDGET_GAP_ANALYSIS_DOC_CSV_HEADERS)[number]
