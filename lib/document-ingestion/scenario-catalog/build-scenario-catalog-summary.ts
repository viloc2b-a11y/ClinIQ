export function buildScenarioCatalogSummary(params: {
  entries: Array<{
    status: "ready" | "partial" | "blocked"
    outputsReady: boolean
  }>
}) {
  const readyCount = params.entries.filter((entry) => entry.status === "ready").length
  const partialCount = params.entries.filter((entry) => entry.status === "partial").length
  const blockedCount = params.entries.filter((entry) => entry.status === "blocked").length
  const outputsReadyCount = params.entries.filter((entry) => entry.outputsReady === true).length

  return {
    data: {
      readyCount,
      partialCount,
      blockedCount,
      outputsReadyCount,
    },
    summary: {
      totalEntries: params.entries.length,
      readyCount,
      partialCount,
      blockedCount,
      outputsReadyCount,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
