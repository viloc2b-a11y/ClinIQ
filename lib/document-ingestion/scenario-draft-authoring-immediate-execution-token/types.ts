export type ScenarioDraftAuthoringImmediateExecutionToken = {
  executionAllowed: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasExecutionTarget: boolean
    executionBlocked: boolean
  }
}

export type ScenarioDraftAuthoringImmediateExecutionTokenResult = {
  data: {
    executionToken: ScenarioDraftAuthoringImmediateExecutionToken
  }
  summary: {
    executionAllowed: boolean
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
