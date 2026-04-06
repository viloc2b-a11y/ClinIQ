export type ScenarioDraftAuthoringInProgressExecutionSeal = {
  inProgress: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasInProgressTarget: boolean
    inProgressBlocked: boolean
  }
}

export type ScenarioDraftAuthoringInProgressExecutionSealResult = {
  data: {
    inProgressExecutionSeal: ScenarioDraftAuthoringInProgressExecutionSeal
  }
  summary: {
    inProgress: boolean
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
