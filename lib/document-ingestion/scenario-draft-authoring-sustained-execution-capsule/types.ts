export type ScenarioDraftAuthoringSustainedExecutionCapsule = {
  sustained: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasSustainedTarget: boolean
    sustainedBlocked: boolean
  }
}

export type ScenarioDraftAuthoringSustainedExecutionCapsuleResult = {
  data: {
    sustainedExecutionCapsule: ScenarioDraftAuthoringSustainedExecutionCapsule
  }
  summary: {
    sustained: boolean
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
