export type ScenarioDraftAuthoringAuthoringReadyOutputMarker = {
  readyForAuthoring: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasAuthoringTarget: boolean
    authoringBlocked: boolean
  }
}

export type ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult = {
  data: {
    authoringReadyOutputMarker: ScenarioDraftAuthoringAuthoringReadyOutputMarker
  }
  summary: {
    readyForAuthoring: boolean
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
