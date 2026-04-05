export function countReadyArtifacts(params: {
  artifacts: {
    report: unknown | null
    executiveSummary: unknown | null
    email: unknown | null
    pdfPayload: unknown | null
    htmlReport: unknown | null
    dashboardCards: unknown | null
    sendReportPayload: unknown | null
    demoSurface: unknown | null
  }
}) {
  const values = [
    params.artifacts.report,
    params.artifacts.executiveSummary,
    params.artifacts.email,
    params.artifacts.pdfPayload,
    params.artifacts.htmlReport,
    params.artifacts.dashboardCards,
    params.artifacts.sendReportPayload,
    params.artifacts.demoSurface,
  ]

  const readyCount = values.filter((item) => item != null).length

  return {
    data: {
      readyCount,
      totalArtifacts: values.length,
    },
    summary: {
      readyCount,
      totalArtifacts: values.length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
