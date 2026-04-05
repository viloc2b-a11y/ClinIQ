export type RevenueBindingStatus =
  | "ready"
  | "partial"
  | "blocked"

export type RevenueBindingResult = {
  data: {
    recordsInput: unknown[]
    actionItemsInput: unknown[]
    claims: unknown | null
    invoices: unknown | null
    leakage: unknown | null
    score: unknown | null
    prioritized: unknown | null
    dashboard: unknown | null
    report: unknown | null
    executiveSummary: unknown | null
    email: unknown | null
    pdfPayload: unknown | null
    htmlReport: unknown | null
    dashboardCards: unknown | null
    sendReportPayload: unknown | null
    demoSurface: unknown | null
  }
  summary: {
    status: RevenueBindingStatus
    revenueReady: boolean
    claimsReady: boolean
    invoicesReady: boolean
    leakageReady: boolean
    outputsReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
