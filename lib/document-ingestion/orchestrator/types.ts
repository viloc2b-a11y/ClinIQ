export type DocumentExecutionOrchestratorStatus =
  | "ready"
  | "partial"
  | "blocked"

export type DocumentExecutionOrchestratorResult = {
  data: {
    intake: unknown
    manualReview: unknown
    humanResolution: unknown | null
    reentry: unknown | null
    downstream: unknown | null
    coreBinding: unknown | null
    actionSeeds: unknown[]
  }
  summary: {
    status: DocumentExecutionOrchestratorStatus
    acceptanceStatus: string | null
    reentryStatus: string | null
    downstreamStatus: string | null
    coreBindingStatus: string | null
    totalActionSeeds: number
    executionReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
