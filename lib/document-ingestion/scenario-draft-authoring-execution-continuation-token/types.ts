export type ScenarioDraftAuthoringExecutionContinuationToken = {
  continuationActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasContinuationTarget: boolean
    continuationBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionContinuationTokenResult = {
  data: {
    executionContinuationToken: ScenarioDraftAuthoringExecutionContinuationToken
  }
  summary: {
    continuationActive: boolean
    sessionCode: string | null
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
