export type ScenarioDraftAuthoringOngoingExecutionMarker = {
  ongoing: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasOngoingTarget: boolean
    ongoingBlocked: boolean
  }
}

export type ScenarioDraftAuthoringOngoingExecutionMarkerResult = {
  data: {
    ongoingExecutionMarker: ScenarioDraftAuthoringOngoingExecutionMarker
  }
  summary: {
    ongoing: boolean
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
