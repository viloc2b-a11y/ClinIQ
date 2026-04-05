import { buildExcelIngestionWarning } from "./build-excel-ingestion-warning"

export function evaluateExcelHardeningStatus(params: {
  selectedSheet: string | null
  parsedRowsCount: number
  canonicalRecordsCount: number
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (!params.selectedSheet || params.parsedRowsCount === 0) {
    status = "blocked"
    warnings.push(
      buildExcelIngestionWarning({
        code: "excel_hardening_blocked",
        message: "Excel hardening could not identify usable parsed rows",
        severity: "error",
      }),
    )
  } else if (params.canonicalRecordsCount === 0) {
    status = "partial"
    warnings.push(
      buildExcelIngestionWarning({
        code: "excel_canonical_partial",
        message: "Excel hardening parsed rows but produced no canonical records",
        severity: "warning",
      }),
    )
  } else {
    warnings.push(
      buildExcelIngestionWarning({
        code: "excel_hardening_ready",
        message: "Excel hardening produced canonical records successfully",
        severity: "info",
      }),
    )
  }

  return {
    data: {
      status,
    },
    summary: {
      status,
      selectedSheet: params.selectedSheet,
      parsedRowsCount: params.parsedRowsCount,
      canonicalRecordsCount: params.canonicalRecordsCount,
    },
    warnings,
  }
}
