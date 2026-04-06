export type ScenarioDraftAuthoringExecutionFocusMarker = {
  focusActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasFocusTarget: boolean
    focusBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionFocusMarkerResult = {
  data: {
    executionFocusMarker: ScenarioDraftAuthoringExecutionFocusMarker
  }
  summary: {
    focusActive: boolean
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
