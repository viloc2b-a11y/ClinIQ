export type CanonicalClinIQRunnerStatus =
  | "ready"
  | "partial"
  | "blocked"

export type CanonicalClinIQRunnerResult = {
  data: {
    sourceInput: {
      fileName: string | null
      sourceType: "excel" | "pdf" | "word" | "unknown"
      route: "excel_hardened" | "legacy" | "unknown"
    }
    pipeline: unknown
    operational: unknown | null
    revenue: unknown | null
    commercialSurface: {
      storyline: string[]
      statusCards: Array<{
        label: string
        value: string | number | boolean
      }>
      topWarnings: Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>
    } | null
    outputs: {
      report: unknown | null
      executiveSummary: unknown | null
      email: unknown | null
      pdfPayload: unknown | null
      htmlReport: unknown | null
      dashboardCards: unknown | null
      sendReportPayload: unknown | null
      demoSurface: unknown | null
    }
  }
  summary: {
    status: CanonicalClinIQRunnerStatus
    sourceType: "excel" | "pdf" | "word" | "unknown"
    route: "excel_hardened" | "legacy" | "unknown"
    documentReady: boolean
    actionCenterReady: boolean
    postPersistenceReady: boolean
    revenueReady: boolean
    outputsReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
