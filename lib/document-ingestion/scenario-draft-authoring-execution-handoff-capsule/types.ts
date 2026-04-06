export type ScenarioDraftAuthoringExecutionHandoffCapsule = {
  handoffActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasHandoffTarget: boolean
    handoffBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionHandoffCapsuleResult = {
  data: {
    executionHandoffCapsule: ScenarioDraftAuthoringExecutionHandoffCapsule
  }
  summary: {
    handoffActive: boolean
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
