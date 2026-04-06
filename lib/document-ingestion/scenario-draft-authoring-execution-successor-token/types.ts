export type ScenarioDraftAuthoringExecutionSuccessorToken = {
  successorActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasSuccessorTarget: boolean
    successorBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionSuccessorTokenResult = {
  data: {
    executionSuccessorToken: ScenarioDraftAuthoringExecutionSuccessorToken
  }
  summary: {
    successorActive: boolean
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
