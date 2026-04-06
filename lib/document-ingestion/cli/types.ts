export type CanonicalCliExecutionStatus =
  | "ready"
  | "partial"
  | "blocked"

export type CanonicalCliExecutionResult = {
  data: {
    input: {
      fileName: string | null
      sourceType: "excel" | "pdf" | "word" | "unknown"
    }
    payload: unknown
    consoleView: {
      headline: string
      status: CanonicalCliExecutionStatus
      readiness: Array<{
        label: string
        value: string | boolean | number
      }>
      topWarnings: Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>
    }
  }
  summary: {
    status: CanonicalCliExecutionStatus
    sourceType: "excel" | "pdf" | "word" | "unknown"
    route: "excel_hardened" | "legacy" | "unknown"
    outputsReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
