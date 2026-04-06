export type ScenarioDraftAuthoringExecutionChainMarker = {
  chainActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasChainTarget: boolean
    chainBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionChainMarkerResult = {
  data: {
    executionChainMarker: ScenarioDraftAuthoringExecutionChainMarker
  }
  summary: {
    chainActive: boolean
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
