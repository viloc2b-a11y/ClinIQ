export type ScenarioDraftAuthoringExecutionContinuityCapsule = {
  continuityActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasContinuityTarget: boolean
    continuityBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionContinuityCapsuleResult = {
  data: {
    executionContinuityCapsule: ScenarioDraftAuthoringExecutionContinuityCapsule
  }
  summary: {
    continuityActive: boolean
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
