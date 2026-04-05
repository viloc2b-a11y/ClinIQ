import type { ReentryDecision } from "./types"

export function buildReentryPayload(params: {
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
  decision: ReentryDecision
}) {
  if (!params.correctedParse) {
    return {
      data: {
        acceptedForReentry: false,
        records: [] as Array<{
          recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
          fields: Record<string, unknown>
          trace?: Record<string, unknown>
        }>,
        appliedCorrections: [] as Array<{
          recordIndex: number
          fieldName: string
          correctedValue: unknown
          applied: boolean
        }>,
      },
      summary: {
        acceptedForReentry: false,
        totalRecords: 0,
        appliedCount: 0,
        status: params.decision.summary.status,
      },
      warnings: params.decision.warnings,
    }
  }

  return {
    data: {
      acceptedForReentry: params.decision.summary.canReenter,
      records: params.decision.summary.canReenter
        ? params.correctedParse.data.records
        : [],
      appliedCorrections: params.correctedParse.data.appliedCorrections,
    },
    summary: {
      acceptedForReentry: params.decision.summary.canReenter,
      totalRecords: params.decision.summary.canReenter
        ? params.correctedParse.summary.totalRecords
        : 0,
      appliedCount: params.correctedParse.summary.appliedCount,
      status: params.decision.summary.status,
    },
    warnings: params.decision.warnings,
  }
}
