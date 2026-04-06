export type ScenarioDraftAuthoringExecutionFocusCapsule = {
  focused: boolean
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

export type ScenarioDraftAuthoringExecutionFocusCapsuleResult = {
  data: {
    executionFocusCapsule: ScenarioDraftAuthoringExecutionFocusCapsule
  }
  summary: {
    focused: boolean
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
