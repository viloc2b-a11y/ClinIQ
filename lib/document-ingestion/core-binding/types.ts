export type CoreBindingStatus =
  | "ready"
  | "partial"
  | "blocked"

export type CoreBindingResult = {
  data: {
    soaBridgeInput: unknown[]
    economicsBridgeInput: unknown[]
    contractBridgeInput: unknown[]
    executionPackage: unknown | null
  }
  summary: {
    status: CoreBindingStatus
    soaRows: number
    economicsRows: number
    contractRows: number
    executionReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
