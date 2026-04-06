export function buildConsoleView(params: {
  fileName: string | null
  sourceType: "excel" | "pdf" | "word" | "unknown"
  status: "ready" | "partial" | "blocked"
  route: "excel_hardened" | "legacy" | "unknown"
  outputsReady: boolean
  artifactsReady: number
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}) {
  const headline = `ClinIQ canonical demo: ${params.fileName || "unknown file"}`

  const readiness = [
    { label: "Source Type", value: params.sourceType },
    { label: "Route", value: params.route },
    { label: "Status", value: params.status },
    { label: "Outputs Ready", value: params.outputsReady },
    { label: "Artifacts Ready", value: params.artifactsReady },
  ]

  return {
    data: {
      consoleView: {
        headline,
        status: params.status,
        readiness,
        topWarnings: params.warnings.slice(0, 5),
      },
    },
    summary: {
      totalReadinessItems: readiness.length,
      totalWarnings: params.warnings.slice(0, 5).length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
