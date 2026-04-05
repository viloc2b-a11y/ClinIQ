import { buildSoaBridgePayload } from "./build-soa-bridge-payload"
import { buildBudgetBridgePayload } from "./build-budget-bridge-payload"
import { buildContractBridgePayload } from "./build-contract-bridge-payload"
import { evaluateBridgeReadiness } from "./evaluate-bridge-readiness"
import type { DownstreamBridgeResult } from "./types"

export function buildDownstreamCanonicalBridge(params: {
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
}): DownstreamBridgeResult {
  const records = params.reentryPayload.data.records

  const soa = buildSoaBridgePayload({ records })
  const budget = buildBudgetBridgePayload({ records })
  const contract = buildContractBridgePayload({ records })

  const readiness = evaluateBridgeReadiness({
    acceptedForReentry: params.reentryPayload.summary.acceptedForReentry,
    totalInputRecords: params.reentryPayload.summary.totalRecords,
    soaRows: soa.summary.totalRows,
    budgetRows: budget.summary.totalRows,
    contractRows: contract.summary.totalRows,
  })

  return {
    data: {
      soa: {
        rows: soa.data.rows,
      },
      budget: {
        rows: budget.data.rows,
      },
      contract: {
        rows: contract.data.rows,
      },
    },
    summary: {
      status: readiness.data.status,
      totalInputRecords: params.reentryPayload.summary.totalRecords,
      soaRows: soa.summary.totalRows,
      budgetRows: budget.summary.totalRows,
      contractRows: contract.summary.totalRows,
    },
    warnings: [
      ...params.reentryPayload.warnings,
      ...soa.warnings,
      ...budget.warnings,
      ...contract.warnings,
      ...readiness.warnings,
    ],
  }
}
