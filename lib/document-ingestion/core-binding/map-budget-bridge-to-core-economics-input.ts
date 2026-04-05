export function mapBudgetBridgeToCoreEconomicsInput(params: {
  rows: Array<{
    category: string
    visitName: string | null
    unitPrice: number | null
    sourceTrace?: Record<string, unknown>
  }>
}) {
  const rows = params.rows.map((row, index) => ({
    rowId: `budget-bridge-${index + 1}`,
    category: row.category,
    visitName: row.visitName,
    unitPrice: row.unitPrice,
    quantity: 1,
    sourceTrace: row.sourceTrace || null,
  }))

  return {
    data: {
      rows,
    },
    summary: {
      totalRows: rows.length,
    },
    warnings: [] as Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>,
  }
}
