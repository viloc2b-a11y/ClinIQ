import type { AdaptedCanonicalRecord } from "../types"

export function buildFallbackAdaptedRecords(params: {
  records: Array<{
    recordType: string
    fields: Record<string, unknown>
    trace?: {
      sourceType?: "excel" | "pdf" | "word" | "unknown"
      fileName?: string
      sheetName?: string
      pageNumber?: number
      rowIndex?: number
      rawTextSnippet?: string
    }
  }>
}): AdaptedCanonicalRecord[] {
  return params.records.map((record) => ({
    recordType:
      record.recordType === "soa_activity" ||
      record.recordType === "budget_line" ||
      record.recordType === "contract_clause" ||
      record.recordType === "invoice_line" ||
      record.recordType === "visit_schedule"
        ? record.recordType
        : "soa_activity",
    fields: record.fields,
    trace: {
      adapterId: "fallback-generic-v1",
      sourceType: record.trace?.sourceType || "unknown",
      fileName: record.trace?.fileName,
      sheetName: record.trace?.sheetName,
      pageNumber: record.trace?.pageNumber,
      rowIndex: record.trace?.rowIndex,
      rawTextSnippet: record.trace?.rawTextSnippet,
    },
  }))
}
