export function mapSoaBridgeToCoreSoaInput(params: {
  rows: Array<{
    visitName: string
    activityDescription: string
    unitPrice: number | null
    sourceTrace?: Record<string, unknown>
  }>
}) {
  const rows = params.rows.map((row, index) => ({
    rowId: `soa-bridge-${index + 1}`,
    visitName: row.visitName,
    activityName: row.activityDescription,
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
