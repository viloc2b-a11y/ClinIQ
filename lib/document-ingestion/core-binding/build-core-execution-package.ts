export function buildCoreExecutionPackage(params: {
  status: "ready" | "partial" | "blocked"
  soaBridgeInput: unknown[]
  economicsBridgeInput: unknown[]
  contractBridgeInput: unknown[]
}) {
  if (params.status === "blocked") {
    return {
      data: {
        executionPackage: null,
      },
      summary: {
        executionReady: false,
      },
      warnings: [
        {
          code: "execution_package_blocked",
          message: "Execution package not built because core binding is blocked",
          severity: "error" as const,
        },
      ],
    }
  }

  const executionPackage = {
    soaRows: params.soaBridgeInput,
    economicsRows: params.economicsBridgeInput,
    contractRows: params.contractBridgeInput,
  }

  return {
    data: {
      executionPackage,
    },
    summary: {
      executionReady: true,
    },
    warnings: [] as Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>,
  }
}
