export type ScenarioDraftAuthoringActiveExecutionEnvelope = {
  active: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasActiveTarget: boolean
    activeBlocked: boolean
  }
}

export type ScenarioDraftAuthoringActiveExecutionEnvelopeResult = {
  data: {
    activeExecutionEnvelope: ScenarioDraftAuthoringActiveExecutionEnvelope
  }
  summary: {
    active: boolean
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
