export type ScenarioDraftAuthoringExecutionLaneMarker = {
  laneActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasLaneTarget: boolean
    laneBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionLaneMarkerResult = {
  data: {
    executionLaneMarker: ScenarioDraftAuthoringExecutionLaneMarker
  }
  summary: {
    laneActive: boolean
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
