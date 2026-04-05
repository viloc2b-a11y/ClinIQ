export type ClinIQCanonicalDemoResult = {
  data: {
    sourceInput: {
      sourceType: "excel" | "pdf" | "word" | "unknown"
      fileName: string | null
    }
    pipeline: unknown
    operationalChain: unknown | null
    revenue: unknown | null
    finalSummary: {
      documentAccepted: boolean
      actionCenterReady: boolean
      recordsReady: boolean
      metricsReady: boolean
      revenueReady: boolean
      outputsReady: boolean
    }
    commercialSnapshot: {
      storyline: string[]
      topMetrics: Array<{
        label: string
        value: string | number
      }>
      topWarnings: Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>
    } | null
    demoSurface: unknown | null
  }
  summary: {
    status: "ready" | "partial" | "blocked"
    sourceType: "excel" | "pdf" | "word" | "unknown"
    documentAccepted: boolean
    actionCenterReady: boolean
    recordsReady: boolean
    metricsReady: boolean
    revenueReady: boolean
    outputsReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
