export type ScenarioDraftAuthoringImmediateLiveExecutionMarker = {
  immediateLive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasImmediateLiveTarget: boolean
    immediateLiveBlocked: boolean
  }
}

export type ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult = {
  data: {
    immediateLiveExecutionMarker: ScenarioDraftAuthoringImmediateLiveExecutionMarker
  }
  summary: {
    immediateLive: boolean
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
