import type { HardenedParseResult, HardenedRecord } from "../types"
import { buildIntakeWarning } from "../build-intake-warning"
import { summarizeHardenedParse } from "../summarize-hardened-parse"
import { detectHeaderRow } from "./detect-header-row"
import { extractExcelMatrix } from "./extract-excel-matrix"

export function parseExcelTabularDocument(params: {
  workbook: Record<string, unknown>
  fileName?: string
}): HardenedParseResult {
  const matrices = extractExcelMatrix(params.workbook)
  const records: HardenedRecord[] = []
  const warnings: HardenedParseResult["warnings"] = []

  for (const matrix of matrices) {
    if (matrix.rows.length === 0) {
      warnings.push(
        buildIntakeWarning({
          code: "empty_sheet",
          message: `Sheet ${matrix.sheetName} is empty`,
          location: { sheetName: matrix.sheetName },
        }),
      )
      continue
    }

    const headerRowIndex = detectHeaderRow(matrix.rows)

    if (headerRowIndex < 0) {
      warnings.push(
        buildIntakeWarning({
          code: "missing_headers",
          message: `No recognizable header row found in ${matrix.sheetName}`,
          location: { sheetName: matrix.sheetName },
        }),
      )
      continue
    }

    const headers = matrix.rows[headerRowIndex].map((h) => h.trim())
    const dataRows = matrix.rows.slice(headerRowIndex + 1)

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row.some(Boolean)) continue

      const fields: HardenedRecord["fields"] = {}

      for (let c = 0; c < headers.length; c++) {
        const header = headers[c] || `column_${c}`
        const value = row[c] ?? ""

        fields[header] = {
          value: value || null,
          confidence: value ? "high" : "low",
          trace: {
            sourceType: "excel",
            fileName: params.fileName,
            sheetName: matrix.sheetName,
            rowIndex: headerRowIndex + 1 + i,
            rawTextSnippet: value || "",
          },
        }
      }

      records.push({
        recordType: "soa_activity",
        fields,
        trace: {
          sourceType: "excel",
          fileName: params.fileName,
          sheetName: matrix.sheetName,
          rowIndex: headerRowIndex + 1 + i,
        },
      })
    }
  }

  return summarizeHardenedParse({
    sourceType: "excel",
    records,
    warnings,
  })
}
