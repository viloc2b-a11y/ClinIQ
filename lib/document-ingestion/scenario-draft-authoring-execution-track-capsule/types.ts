export type ScenarioDraftAuthoringExecutionTrackCapsule = {
  trackActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasTrackTarget: boolean
    trackBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionTrackCapsuleResult = {
  data: {
    executionTrackCapsule: ScenarioDraftAuthoringExecutionTrackCapsule
  }
  summary: {
    trackActive: boolean
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
