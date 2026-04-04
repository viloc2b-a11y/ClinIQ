import { budgetGapResultToNegotiationEngineInput } from "./negotiation-input"
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
