export type ScenarioDraftAuthoringExecutionStreamMarker = {
  streamActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasStreamTarget: boolean
    streamBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionStreamMarkerResult = {
  data: {
    executionStreamMarker: ScenarioDraftAuthoringExecutionStreamMarker
  }
  summary: {
    streamActive: boolean
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
