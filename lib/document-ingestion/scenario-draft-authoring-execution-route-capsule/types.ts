export type ScenarioDraftAuthoringExecutionRouteCapsule = {
  routeActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasRouteTarget: boolean
    routeBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionRouteCapsuleResult = {
  data: {
    executionRouteCapsule: ScenarioDraftAuthoringExecutionRouteCapsule
  }
  summary: {
    routeActive: boolean
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
