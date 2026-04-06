export function buildScenarioMatrixSummary(params: {
  rows: Array<{
    status: "ready" | "partial" | "blocked"
    outputsReady: boolean
  }>
}) {
  const readyCount = params.rows.filter((row) => row.status === "ready").length
  const partialCount = params.rows.filter((row) => row.status === "partial").length
  const blockedCount = params.rows.filter((row) => row.status === "blocked").length
  const outputsReadyCount = params.rows.filter((row) => row.outputsReady === true).length

  return {
    data: {
      readyCount,
      partialCount,
      blockedCount,
      outputsReadyCount,
    },
    summary: {
      totalScenarios: params.rows.length,
      readyCount,
      partialCount,
      blockedCount,
      outputsReadyCount,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
