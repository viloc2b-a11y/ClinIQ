import type { HumanResolutionPayload } from "./types"

export function validateHumanResolutionPayload(params: {
  payload: HumanResolutionPayload
  adaptedRecords: Array<{
    recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
    fields: Record<string, unknown>
  }>
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  for (const correction of params.payload.corrections) {
    const record = params.adaptedRecords[correction.recordIndex]

    if (!record) {
      warnings.push({
        code: "invalid_record_index",
        message: `Correction references missing record index ${correction.recordIndex}`,
        severity: "error",
      })
      continue
    }

    if (record.recordType !== correction.recordType) {
      warnings.push({
        code: "record_type_mismatch",
        message: `Correction recordType mismatch at index ${correction.recordIndex}`,
        severity: "error",
      })
    }

    if (!(correction.fieldName in record.fields)) {
      warnings.push({
        code: "invalid_field_name",
        message: `Correction field ${correction.fieldName} does not exist on record ${correction.recordIndex}`,
        severity: "error",
      })
    }

    if (correction.decision === "approve" && correction.correctedValue == null) {
      warnings.push({
        code: "missing_corrected_value",
        message: `Approved correction missing corrected value for ${correction.fieldName}`,
        severity: "error",
      })
    }
  }

  return {
    data: {
      valid: warnings.every((w) => w.severity !== "error"),
    },
    summary: {
      totalCorrections: params.payload.corrections.length,
      totalWarnings: warnings.length,
      valid: warnings.every((w) => w.severity !== "error"),
    },
    warnings,
  }
}
