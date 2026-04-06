export type ScenarioDraftAuthoringExecutionRelayToken = {
  relayActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasRelayTarget: boolean
    relayBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionRelayTokenResult = {
  data: {
    executionRelayToken: ScenarioDraftAuthoringExecutionRelayToken
  }
  summary: {
    relayActive: boolean
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
