import type { AdapterRunResult, AdaptedCanonicalRecord } from "../types"
import { getFieldString } from "../shared/get-field-string"
import { getTrace } from "../shared/get-trace"

export function runBudgetLayoutAdapterV1(params: {
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
    const category = getFieldString(record.fields, [
      "category",
      "activityDescription",
      "procedure",
      "activity",
      "rawLine",
      "rawline",
      "rawSection",
      "rawsection",
    ])

    const unitPrice = getFieldString(record.fields, [
      "unitPrice",
      "fee",
      "amount",
      "payment",
    ])

    const visitName = getFieldString(record.fields, [
      "visitName",
      "visit",
      "schedule",
    ])

    if (!category && !unitPrice) continue

    adapted.push({
      recordType: "budget_line",
      fields: {
        category,
        unitPrice,
        visitName,
      },
      trace: getTrace({
        adapterId: "budget-v1",
        record,
      }),
    })
  }

  return {
    data: {
      adapter: {
        adapterId: "budget-v1",
        intent: "budget",
        confidence: adapted.length > 0 ? "high" : "low",
        reason: `adapted budget records=${adapted.length}`,
      },
      records: adapted,
      fallbackUsed: adapted.length === 0,
    },
    summary: {
      intent: "budget",
      adapterId: "budget-v1",
      totalRecords: adapted.length,
      fallbackUsed: adapted.length === 0,
    },
    warnings:
      adapted.length === 0
        ? [
            {
              code: "adapter_no_records",
              message: "Budget adapter matched but produced no canonical records",
              severity: "warning" as const,
            },
          ]
        : [],
  }
}
