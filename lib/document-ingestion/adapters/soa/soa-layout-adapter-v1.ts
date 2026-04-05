import type { AdapterRunResult, AdaptedCanonicalRecord } from "../types"
import { getFieldString } from "../shared/get-field-string"
import { getTrace } from "../shared/get-trace"

export function runSoaLayoutAdapterV1(params: {
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
}): AdapterRunResult {
  const adapted: AdaptedCanonicalRecord[] = []

  for (const record of params.records) {
    const visitName = getFieldString(record.fields, [
      "visitName",
      "visit",
      "schedule",
    ])

    const activityDescription = getFieldString(record.fields, [
      "activityDescription",
      "procedure",
      "activity",
      "event",
      "rawLine",
      "rawline",
      "rawSection",
      "rawsection",
    ])

    const unitPrice = getFieldString(record.fields, [
      "unitPrice",
      "fee",
      "amount",
    ])

    if (!visitName && !activityDescription) continue

    adapted.push({
      recordType: "soa_activity",
      fields: {
        visitName,
        activityDescription,
        unitPrice,
      },
      trace: getTrace({
        adapterId: "soa-v1",
        record,
      }),
    })
  }

  return {
    data: {
      adapter: {
        adapterId: "soa-v1",
        intent: "soa",
        confidence: adapted.length > 0 ? "high" : "low",
        reason: `adapted soa records=${adapted.length}`,
      },
      records: adapted,
      fallbackUsed: adapted.length === 0,
    },
    summary: {
      intent: "soa",
      adapterId: "soa-v1",
      totalRecords: adapted.length,
      fallbackUsed: adapted.length === 0,
    },
    warnings:
      adapted.length === 0
        ? [
            {
              code: "adapter_no_records",
              message: "SoA adapter matched but produced no canonical records",
              severity: "warning" as const,
            },
          ]
        : [],
  }
}
