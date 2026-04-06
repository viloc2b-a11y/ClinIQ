export type ScenarioDraftAuthoringCurrentExecutionStamp = {
  current: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasCurrentTarget: boolean
    currentBlocked: boolean
  }
}

export type ScenarioDraftAuthoringCurrentExecutionStampResult = {
  data: {
    currentExecutionStamp: ScenarioDraftAuthoringCurrentExecutionStamp
  }
  summary: {
    current: boolean
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
