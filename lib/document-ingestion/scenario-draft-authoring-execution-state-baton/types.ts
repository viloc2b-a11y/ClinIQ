export type ScenarioDraftAuthoringExecutionStateBaton = {
  executionStateActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasExecutionStateTarget: boolean
    executionStateBlocked: boolean
  }
}

export type ScenarioDraftAuthoringExecutionStateBatonResult = {
  data: {
    executionStateBaton: ScenarioDraftAuthoringExecutionStateBaton
  }
  summary: {
    executionStateActive: boolean
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
