export type ScenarioDraftAuthoringExecutionCarryForwardCapsule = {
  carryForwardActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasCarryForwardTarget: boolean
    carryForwardBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult = {
  data: {
    executionCarryForwardCapsule: ScenarioDraftAuthoringExecutionCarryForwardCapsule
  }
  summary: {
    carryForwardActive: boolean
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
