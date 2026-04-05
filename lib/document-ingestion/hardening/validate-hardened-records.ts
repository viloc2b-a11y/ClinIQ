import type { HardenedRecord, IntakeWarning } from "./types"
import { buildIntakeWarning } from "./build-intake-warning"

export function validateHardenedRecords(records: HardenedRecord[]): IntakeWarning[] {
  const warnings: IntakeWarning[] = []

  for (const record of records) {
    const visitName = record.fields.visitName?.value
    const activityDescription = record.fields.activityDescription?.value
    const unitPrice = record.fields.unitPrice?.value

    if (record.recordType === "soa_activity") {
      if (!visitName) {
        warnings.push(
          buildIntakeWarning({
            code: "ambiguous_visit_name",
            message: "Missing or ambiguous visit name in soa_activity record",
            location: {
              sheetName: record.trace?.sheetName,
              rowIndex: record.trace?.rowIndex,
              pageNumber: record.trace?.pageNumber,
            },
          }),
        )
      }

      if (!activityDescription) {
        warnings.push(
          buildIntakeWarning({
            code: "partial_parse",
            message: "Missing activity description in soa_activity record",
            location: {
              sheetName: record.trace?.sheetName,
              rowIndex: record.trace?.rowIndex,
              pageNumber: record.trace?.pageNumber,
            },
          }),
        )
      }

      if (!unitPrice) {
        warnings.push(
          buildIntakeWarning({
            code: "ambiguous_fee",
            message: "Missing or ambiguous fee in soa_activity record",
            location: {
              sheetName: record.trace?.sheetName,
              rowIndex: record.trace?.rowIndex,
              pageNumber: record.trace?.pageNumber,
            },
          }),
        )
      }
    }
  }

  return warnings
}
