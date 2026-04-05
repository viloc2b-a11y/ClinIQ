import type { ExtractedRow } from "./extract-row-fields"
import { evaluateExcelHardeningStatus } from "./evaluate-excel-hardening-status"
import { resolveWorkbookSheets } from "./resolve-workbook-sheets"
import { runExcelHardening } from "./run-excel-hardening"
import { toCanonicalRecords } from "./to-canonical-records"

export function runExcelCanonicalIngestion(params: {
  workbook: Record<string, unknown>
  fileName?: string
}) {
  const grid = resolveWorkbookSheets(params.workbook)

  const hardening = runExcelHardening({
    workbook: grid,
    fileName: params.fileName,
  })

  const parsedRows = Array.isArray(hardening.data.parsedRows) ? hardening.data.parsedRows : []

  const selectedSheet = hardening.data.selectedSheet || ""

  const canonical = toCanonicalRecords({
    selectedSheet,
    parsedRows: parsedRows as ExtractedRow[],
    fileName: params.fileName ?? null,
  })

  const records = Array.isArray(canonical.data.records) ? canonical.data.records : []

  const status = evaluateExcelHardeningStatus({
    selectedSheet: selectedSheet || null,
    parsedRowsCount: parsedRows.length,
    canonicalRecordsCount: records.length,
  })

  return {
    data: {
      selectedSheet: selectedSheet || null,
      parsedRows,
      canonicalRecords: records,
      hardening,
      canonical,
    },
    summary: {
      status: status.data.status,
      selectedSheet: selectedSheet || null,
      parsedRowsCount: parsedRows.length,
      canonicalRecordsCount: records.length,
    },
    warnings: [...hardening.warnings, ...canonical.warnings, ...status.warnings],
  }
}
