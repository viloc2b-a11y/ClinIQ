export type ScenarioDraftAuthoringExecutionSequenceCapsule = {
  sequenceActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasSequenceTarget: boolean
    sequenceBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionSequenceCapsuleResult = {
  data: {
    executionSequenceCapsule: ScenarioDraftAuthoringExecutionSequenceCapsule
  }
  summary: {
    sequenceActive: boolean
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
