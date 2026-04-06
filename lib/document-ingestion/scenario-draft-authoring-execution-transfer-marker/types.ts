export type ScenarioDraftAuthoringExecutionTransferMarker = {
  transferActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasTransferTarget: boolean
    transferBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionTransferMarkerResult = {
  data: {
    executionTransferMarker: ScenarioDraftAuthoringExecutionTransferMarker
  }
  summary: {
    transferActive: boolean
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
