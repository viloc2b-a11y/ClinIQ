export function mapContractBridgeToCoreContractInput(params: {
  rows: Array<{
    clauseType: string
    clauseText: string
    sourceTrace?: Record<string, unknown>
  }>
}) {
  const rows = params.rows.map((row, index) => ({
    rowId: `contract-bridge-${index + 1}`,
    clauseType: row.clauseType,
    clauseText: row.clauseText,
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
