export type ScenarioDraftAuthoringExecutionFlowCapsule = {
  flowActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasFlowTarget: boolean
    flowBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionFlowCapsuleResult = {
  data: {
    executionFlowCapsule: ScenarioDraftAuthoringExecutionFlowCapsule
  }
  summary: {
    flowActive: boolean
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
