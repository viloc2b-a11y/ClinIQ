import type { AdapterRunResult } from "./types"
import { detectDocumentIntent } from "./detect-document-intent"
import { runSoaLayoutAdapterV1 } from "./soa/soa-layout-adapter-v1"
import { runBudgetLayoutAdapterV1 } from "./budget/budget-layout-adapter-v1"
import { runContractLayoutAdapterV1 } from "./contract/contract-layout-adapter-v1"
import { buildFallbackAdaptedRecords } from "./fallback/build-fallback-adapted-records"

export function runLayoutAdapter(params: {
  fileName?: string
  rawText?: string
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
  const detection = detectDocumentIntent({
    fileName: params.fileName,
    rawText: params.rawText,
    normalizedRecords: params.records,
  })

  let result: AdapterRunResult | null = null

  if (detection.intent === "soa") {
    result = runSoaLayoutAdapterV1({ records: params.records })
  } else if (detection.intent === "budget") {
    result = runBudgetLayoutAdapterV1({ records: params.records })
  } else if (detection.intent === "contract") {
    result = runContractLayoutAdapterV1({ records: params.records })
  }

  if (!result || result.summary.totalRecords === 0) {
    const fallbackRecords = buildFallbackAdaptedRecords({
      records: params.records,
    })

    return {
      data: {
        adapter:
          detection.candidates[0] || {
            adapterId: "fallback-generic-v1",
            intent: "unknown",
            confidence: "low",
            reason: "no adapter matched",
          },
        records: fallbackRecords,
        fallbackUsed: true,
      },
      summary: {
        intent: detection.intent,
        adapterId: null,
        totalRecords: fallbackRecords.length,
        fallbackUsed: true,
      },
      warnings: [
        {
          code: "adapter_fallback_used",
          message: "No targeted adapter produced canonical output; generic fallback used",
          severity: "warning",
        },
      ],
    }
  }

  return {
    ...result,
    data: {
      ...result.data,
      fallbackUsed: false,
    },
    summary: {
      ...result.summary,
      fallbackUsed: false,
    },
  }
}
