export function countTraceArtifacts(params: {
  outputs: {
    report?: unknown | null
    executiveSummary?: unknown | null
    email?: unknown | null
    pdfPayload?: unknown | null
    htmlReport?: unknown | null
    dashboardCards?: unknown | null
    sendReportPayload?: unknown | null
    demoSurface?: unknown | null
  } | null
}) {
  const outputs = params.outputs || {}

  const flags = {
    reportReady: outputs.report != null,
    executiveSummaryReady: outputs.executiveSummary != null,
    emailReady: outputs.email != null,
    pdfPayloadReady: outputs.pdfPayload != null,
    htmlReportReady: outputs.htmlReport != null,
    dashboardCardsReady: outputs.dashboardCards != null,
    sendReportPayloadReady: outputs.sendReportPayload != null,
    demoSurfaceReady: outputs.demoSurface != null,
  }

  const artifactsReady = Object.values(flags).filter(Boolean).length

  return {
    data: {
      artifactsReady,
      ...flags,
    },
    summary: {
      artifactsReady,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
