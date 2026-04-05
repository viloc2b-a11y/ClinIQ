import type { CoreBindingResult } from "./types"
import { mapSoaBridgeToCoreSoaInput } from "./map-soa-bridge-to-core-soa-input"
import { mapBudgetBridgeToCoreEconomicsInput } from "./map-budget-bridge-to-core-economics-input"
import { mapContractBridgeToCoreContractInput } from "./map-contract-bridge-to-core-contract-input"
import { evaluateCoreBindingStatus } from "./evaluate-core-binding-status"
import { buildCoreExecutionPackage } from "./build-core-execution-package"

export function runCoreBinding(params: {
  downstream: {
    data: {
      bridge: {
        data: {
          soa: {
            rows: Array<{
              visitName: string
              activityDescription: string
              unitPrice: number | null
              sourceTrace?: Record<string, unknown>
            }>
          }
          budget: {
            rows: Array<{
              category: string
              visitName: string | null
              unitPrice: number | null
              sourceTrace?: Record<string, unknown>
            }>
          }
          contract: {
            rows: Array<{
              clauseType: string
              clauseText: string
              sourceTrace?: Record<string, unknown>
            }>
          }
        }
        summary: {
          status: "ready" | "partial" | "blocked"
          soaRows: number
          budgetRows: number
          contractRows: number
        }
      }
    }
  }
}): CoreBindingResult {
  const soa = mapSoaBridgeToCoreSoaInput({
    rows: params.downstream.data.bridge.data.soa.rows,
  })

  const economics = mapBudgetBridgeToCoreEconomicsInput({
    rows: params.downstream.data.bridge.data.budget.rows,
  })

  const contract = mapContractBridgeToCoreContractInput({
    rows: params.downstream.data.bridge.data.contract.rows,
  })

  const binding = evaluateCoreBindingStatus({
    downstreamStatus: params.downstream.data.bridge.summary.status,
    soaRows: soa.summary.totalRows,
    economicsRows: economics.summary.totalRows,
    contractRows: contract.summary.totalRows,
  })

  const executionPackage = buildCoreExecutionPackage({
    status: binding.data.status,
    soaBridgeInput: soa.data.rows,
    economicsBridgeInput: economics.data.rows,
    contractBridgeInput: contract.data.rows,
  })

  return {
    data: {
      soaBridgeInput: soa.data.rows,
      economicsBridgeInput: economics.data.rows,
      contractBridgeInput: contract.data.rows,
      executionPackage: executionPackage.data.executionPackage,
    },
    summary: {
      status: binding.data.status,
      soaRows: soa.summary.totalRows,
      economicsRows: economics.summary.totalRows,
      contractRows: contract.summary.totalRows,
      executionReady: executionPackage.summary.executionReady,
    },
    warnings: [
      ...soa.warnings,
      ...economics.warnings,
      ...contract.warnings,
      ...binding.warnings,
      ...executionPackage.warnings,
    ],
  }
}
