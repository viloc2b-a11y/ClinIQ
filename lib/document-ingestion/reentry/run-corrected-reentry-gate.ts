import { evaluateCorrectedReentry } from "./evaluate-corrected-reentry"
import { buildReentryPayload } from "./build-reentry-payload"
import { buildReentrySummary } from "./build-reentry-summary"

export function runCorrectedReentryGate(params: {
  correctedParse: {
    data: {
      sourceType: "excel" | "pdf" | "word" | "unknown"
      fileName: string | null
      records: Array<{
        recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
        fields: Record<string, unknown>
        trace?: Record<string, unknown>
      }>
      appliedCorrections: Array<{
        recordIndex: number
        fieldName: string
        correctedValue: unknown
        applied: boolean
      }>
    }
    summary: {
      sourceType: "excel" | "pdf" | "word" | "unknown"
      totalRecords: number
      appliedCount: number
    }
  } | null
}) {
  const decision = evaluateCorrectedReentry({
    correctedParse: params.correctedParse
      ? {
          data: {
            records: params.correctedParse.data.records,
            appliedCorrections: params.correctedParse.data.appliedCorrections,
          },
          summary: params.correctedParse.summary,
        }
      : null,
  })

  const reentryPayload = buildReentryPayload({
    correctedParse: params.correctedParse,
    decision,
  })

  const reentrySummary = buildReentrySummary({
    decision,
  })

  return {
    data: {
      decision,
      reentryPayload,
      reentrySummary,
    },
    summary: {
      status: decision.summary.status,
      canReenter: decision.summary.canReenter,
      totalRecords: reentryPayload.summary.totalRecords,
      appliedCount: reentryPayload.summary.appliedCount,
    },
    warnings: [
      ...decision.warnings,
      ...reentryPayload.warnings,
      ...reentrySummary.warnings,
    ],
  }
}
