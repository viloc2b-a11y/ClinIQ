export type CanonicalDemoPayloadStatus =
  | "ready"
  | "partial"
  | "blocked"

export type CanonicalDemoPayload = {
  data: {
    meta: {
      fileName: string | null
      sourceType: "excel" | "pdf" | "word" | "unknown"
      route: "excel_hardened" | "legacy" | "unknown"
      generatedAt: string
      schemaVersion: "1.0"
    }
    readiness: {
      documentReady: boolean
      actionCenterReady: boolean
      postPersistenceReady: boolean
      revenueReady: boolean
      outputsReady: boolean
    }
    storyline: string[]
    statusCards: Array<{
      label: string
      value: string | number | boolean
    }>
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
    topWarnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
  summary: {
    status: CanonicalDemoPayloadStatus
    sourceType: "excel" | "pdf" | "word" | "unknown"
    route: "excel_hardened" | "legacy" | "unknown"
    artifactsReady: number
    outputsReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
