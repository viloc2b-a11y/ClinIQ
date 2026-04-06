export type ScenarioDraftAuthoringLiveExecutionMarker = {
  live: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasLiveTarget: boolean
    liveBlocked: boolean
  }
}

export type ScenarioDraftAuthoringLiveExecutionMarkerResult = {
  data: {
    liveExecutionMarker: ScenarioDraftAuthoringLiveExecutionMarker
  }
  summary: {
    live: boolean
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
