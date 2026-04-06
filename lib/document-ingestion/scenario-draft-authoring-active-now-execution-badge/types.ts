export type ScenarioDraftAuthoringActiveNowExecutionBadge = {
  activeNow: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasActiveNowTarget: boolean
    activeNowBlocked: boolean
  }
}

export type ScenarioDraftAuthoringActiveNowExecutionBadgeResult = {
  data: {
    activeNowExecutionBadge: ScenarioDraftAuthoringActiveNowExecutionBadge
  }
  summary: {
    activeNow: boolean
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
