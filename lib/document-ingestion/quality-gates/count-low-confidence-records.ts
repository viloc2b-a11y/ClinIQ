import type { HardenedRecord } from "../hardening/types"
import { scoreRecordConfidence } from "../hardening/score-record-confidence"

export function countLowConfidenceRecords(params: {
  records: Array<{
    recordType:
      | "soa_activity"
      | "budget_line"
      | "contract_clause"
      | "invoice_line"
      | "visit_schedule"
    fields: Record<string, unknown>
  }>
}): {
  totalRecords: number
  lowConfidenceRecords: number
} {
  let lowConfidenceRecords = 0

  for (const record of params.records) {
    const confidence = scoreRecordConfidence({
      recordType: record.recordType,
      fields: normalizeFields(record.fields),
    } as HardenedRecord)

    if (confidence === "low") lowConfidenceRecords += 1
  }

  return {
    totalRecords: params.records.length,
    lowConfidenceRecords,
  }
}

function normalizeFields(fields: Record<string, unknown>) {
  const normalized: Record<
    string,
    { value: unknown; confidence: "high" | "medium" | "low" }
  > = {}

  for (const [key, value] of Object.entries(fields)) {
    if (
      value &&
      typeof value === "object" &&
      "value" in (value as Record<string, unknown>) &&
      "confidence" in (value as Record<string, unknown>)
    ) {
      normalized[key] = value as {
        value: unknown
        confidence: "high" | "medium" | "low"
      }
    } else {
      normalized[key] = {
        value,
        confidence: value ? "medium" : "low",
      }
    }
  }

  return normalized
}
