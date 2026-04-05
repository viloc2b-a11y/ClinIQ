export function buildActionCenterSeeds(params: {
  coreBinding: {
    data: {
      soaBridgeInput: Array<{
        rowId: string
        visitName: string
        activityName: string
        unitPrice: number | null
        quantity: number
        sourceTrace?: Record<string, unknown> | null
      }>
      economicsBridgeInput: Array<{
        rowId: string
        category: string
        visitName: string | null
        unitPrice: number | null
        quantity: number
        sourceTrace?: Record<string, unknown> | null
      }>
      contractBridgeInput: Array<{
        rowId: string
        clauseType: string
        clauseText: string
        sourceTrace?: Record<string, unknown> | null
      }>
      executionPackage: unknown | null
    }
    summary: {
      status: "ready" | "partial" | "blocked"
      soaRows: number
      economicsRows: number
      contractRows: number
      executionReady: boolean
    }
  } | null
}) {
  if (!params.coreBinding || !params.coreBinding.data.executionPackage) {
    return {
      data: {
        actionSeeds: [] as unknown[],
      },
      summary: {
        totalActionSeeds: 0,
      },
      warnings: [
        {
          code: "no_execution_package_for_action_seeds",
          message: "Action Center seeds not built because execution package is unavailable",
          severity: "error" as const,
        },
      ],
    }
  }

  const soaSeeds = params.coreBinding.data.soaBridgeInput.map((row) => ({
    seedId: `seed-${row.rowId}`,
    type: "soa_activity_review",
    title: `${row.visitName} — ${row.activityName}`,
    estimatedValue: row.unitPrice || 0,
    sourceTrace: row.sourceTrace || null,
  }))

  const economicsSeeds = params.coreBinding.data.economicsBridgeInput.map((row) => ({
    seedId: `seed-${row.rowId}`,
    type: "budget_line_review",
    title: `${row.category}${row.visitName ? ` — ${row.visitName}` : ""}`,
    estimatedValue: row.unitPrice || 0,
    sourceTrace: row.sourceTrace || null,
  }))

  const contractSeeds = params.coreBinding.data.contractBridgeInput.map((row) => ({
    seedId: `seed-${row.rowId}`,
    type: "contract_clause_review",
    title: `${row.clauseType}`,
    estimatedValue: 0,
    sourceTrace: row.sourceTrace || null,
  }))

  const actionSeeds = [...soaSeeds, ...economicsSeeds, ...contractSeeds]

  return {
    data: {
      actionSeeds,
    },
    summary: {
      totalActionSeeds: actionSeeds.length,
    },
    warnings: [] as Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>,
  }
}
