export type ScenarioDraftAuthoringExecutionPathMarker = {
  pathActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasPathTarget: boolean
    pathBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionPathMarkerResult = {
  data: {
    executionPathMarker: ScenarioDraftAuthoringExecutionPathMarker
  }
  summary: {
    pathActive: boolean
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
