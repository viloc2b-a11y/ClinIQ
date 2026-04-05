import { buildDownstreamCanonicalBridge } from "./build-downstream-canonical-bridge"
import { buildEngineIntakePayloads } from "./build-engine-intake-payloads"

export function runDownstreamCanonicalBridge(params: {
  reentryPayload: {
    data: {
      acceptedForReentry: boolean
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
      acceptedForReentry: boolean
      totalRecords: number
      appliedCount: number
      status: "accepted" | "accepted_with_warnings" | "manual_review_required" | "rejected"
    }
    warnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
}) {
  const bridge = buildDownstreamCanonicalBridge({
    reentryPayload: params.reentryPayload,
  })

  const enginePayloads = buildEngineIntakePayloads({
    bridge,
  })

  return {
    data: {
      bridge,
      enginePayloads,
    },
    summary: {
      status: bridge.summary.status,
      totalInputRecords: bridge.summary.totalInputRecords,
      soaRows: bridge.summary.soaRows,
      budgetRows: bridge.summary.budgetRows,
      contractRows: bridge.summary.contractRows,
    },
    warnings: [...bridge.warnings, ...enginePayloads.warnings],
  }
}
