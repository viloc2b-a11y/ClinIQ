import type { AdapterRunResult, AdaptedCanonicalRecord } from "../types"
import { getFieldString } from "../shared/get-field-string"
import { getTrace } from "../shared/get-trace"

export function runContractLayoutAdapterV1(params: {
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
    const clauseText = getFieldString(record.fields, [
      "rawSection",
      "rawsection",
      "rawLine",
      "rawline",
      "activityDescription",
    ])

    if (!clauseText) continue

    const clauseType = /payment/i.test(clauseText)
      ? "payment_terms"
      : /confidential/i.test(clauseText)
        ? "confidentiality"
        : /termination/i.test(clauseText)
          ? "termination"
          : /indemn/i.test(clauseText)
            ? "indemnification"
            : "general"

    adapted.push({
      recordType: "contract_clause",
      fields: {
        clauseType,
        clauseText,
      },
      trace: getTrace({
        adapterId: "contract-v1",
        record,
      }),
    })
  }

  return {
    data: {
      adapter: {
        adapterId: "contract-v1",
        intent: "contract",
        confidence: adapted.length > 0 ? "high" : "low",
        reason: `adapted contract records=${adapted.length}`,
      },
      records: adapted,
      fallbackUsed: adapted.length === 0,
    },
    summary: {
      intent: "contract",
      adapterId: "contract-v1",
      totalRecords: adapted.length,
      fallbackUsed: adapted.length === 0,
    },
    warnings:
      adapted.length === 0
        ? [
            {
              code: "adapter_no_records",
              message: "Contract adapter matched but produced no canonical records",
              severity: "warning" as const,
            },
          ]
        : [],
  }
}
