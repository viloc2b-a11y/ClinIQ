export type ScenarioDraftAuthoringFinalizedDraftOutputFields = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringFinalizedDraftOutput = {
  finalizedReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  finalizedTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  finalizedFields: ScenarioDraftAuthoringFinalizedDraftOutputFields
  summary: {
    hasFinalizedTarget: boolean
    finalizedBlocked: boolean
    finalizedIsEmpty: boolean
    finalizedMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringFinalizedDraftOutputResult = {
  data: {
    finalizedDraftOutput: ScenarioDraftAuthoringFinalizedDraftOutput
  }
  summary: {
    finalizedReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    finalizedIsEmpty: boolean
    finalizedMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
