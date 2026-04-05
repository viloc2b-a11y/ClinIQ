import { classifyRows } from "./classify-rows"
import { detectRelevantSheets } from "./detect-relevant-sheets"
import { detectTableBoundary } from "./detect-table-boundary"
import { extractFieldsForDataRows } from "./extract-row-fields"
import { normalizeHeaders } from "./normalize-headers"
import { sheetToRows } from "./shared/workbook-rows"

const MAX_WARNINGS = 24

export function runExcelHardening(params: {
  workbook: Record<string, unknown>
  /** Reserved for trace / future steps; hardening logic is sheet-grid only. */
  fileName?: string
}) {
  const warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }> =
    []

  const sheetDetection = detectRelevantSheets({ workbook: params.workbook })
  warnings.push(...sheetDetection.warnings)

  const ranked = sheetDetection.data.rankedSheets
  if (ranked.length === 0) {
    return {
      data: {
        selectedSheet: "",
        parsedRows: [] as unknown[],
      },
      summary: {
        totalRows: 0,
        usableRows: 0,
        avgConfidence: 0,
        extractionRate: 0,
      },
      warnings: [
        ...warnings,
        {
          code: "excel_hardening_aborted",
          message: "Excel hardening stopped: no sheets in workbook",
          severity: "error" as const,
        },
      ],
    }
  }

  const best = ranked[0]!
  const selectedSheet = best.sheetName
  const rows = sheetToRows(params.workbook[selectedSheet])

  const boundary = detectTableBoundary({ rows })
  warnings.push(...boundary.warnings)

  const { headerRowIndex, startRowIndex, endRowIndex } = boundary.data
  const headerRow = rows[headerRowIndex] || []
  const norm = normalizeHeaders({ headerRow })
  warnings.push(...norm.warnings)

  const headerTexts = norm.data.headers.map((h) => h.original)

  const classified = classifyRows({
    rows,
    headerRowIndex,
    headerTexts,
    startRowIndex,
    endRowIndex,
  })
  const classifyWarnings = classified.warnings.slice(0, 8)
  warnings.push(...classifyWarnings)

  const extracted = extractFieldsForDataRows({
    rows,
    classifications: classified.data.classifications,
    headers: norm.data.headers,
  })

  const parsedRows = extracted.data.rows as unknown[]

  const spanRows = Math.max(0, endRowIndex - startRowIndex + 1)
  const bodyRowSlots = Math.max(1, spanRows - 1)
  const usableRows = extracted.data.rows.length
  const extractionRate =
    Math.round(Math.min(1, usableRows / bodyRowSlots) * 1000) / 1000

  const confs = extracted.data.rows.map((r) => r.overallConfidence)
  const avgConfidence =
    confs.length === 0
      ? 0
      : Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 1000) / 1000

  if (usableRows === 0) {
    warnings.push({
      code: "excel_no_usable_rows",
      message: "No data rows extracted after classification; check boundaries and headers",
      severity: "warning",
    })
  }

  if (best.score < 15) {
    warnings.push({
      code: "excel_weak_sheet_selection",
      message: `Selected sheet "${selectedSheet}" has low relevance score (${best.score})`,
      severity: "warning",
    })
  }

  return {
    data: {
      selectedSheet,
      parsedRows,
    },
    summary: {
      totalRows: spanRows,
      usableRows,
      avgConfidence,
      extractionRate,
    },
    warnings: warnings.slice(0, MAX_WARNINGS),
  }
}
