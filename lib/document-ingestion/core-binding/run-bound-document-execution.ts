import { runCoreBinding } from "./run-core-binding"

export function runBoundDocumentExecution(params: {
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
  executeDocumentPackage?: (input: {
    soaRows: unknown[]
    economicsRows: unknown[]
    contractRows: unknown[]
  }) => unknown
}) {
  const binding = runCoreBinding({
    downstream: params.downstream,
  })

  if (!binding.data.executionPackage || !params.executeDocumentPackage) {
    return {
      data: {
        binding,
        executionResult: null,
      },
      summary: {
        status: binding.summary.status,
        executionReady: binding.summary.executionReady,
        executed: false,
      },
      warnings: binding.warnings,
    }
  }

  const executionResult = params.executeDocumentPackage(
    binding.data.executionPackage as {
      soaRows: unknown[]
      economicsRows: unknown[]
      contractRows: unknown[]
    },
  )

  return {
    data: {
      binding,
      executionResult,
    },
    summary: {
      status: binding.summary.status,
      executionReady: binding.summary.executionReady,
      executed: true,
    },
    warnings: binding.warnings,
  }
}
