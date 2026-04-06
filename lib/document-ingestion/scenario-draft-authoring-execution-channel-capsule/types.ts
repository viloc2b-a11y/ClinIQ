export type ScenarioDraftAuthoringExecutionChannelCapsule = {
  channelActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasChannelTarget: boolean
    channelBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionChannelCapsuleResult = {
  data: {
    executionChannelCapsule: ScenarioDraftAuthoringExecutionChannelCapsule
  }
  summary: {
    channelActive: boolean
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
