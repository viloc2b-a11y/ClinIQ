export type ScenarioDraftAuthoringExecutionCorridorMarker = {
  corridorActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasCorridorTarget: boolean
    corridorBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionCorridorMarkerResult = {
  data: {
    executionCorridorMarker: ScenarioDraftAuthoringExecutionCorridorMarker
  }
  summary: {
    corridorActive: boolean
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
