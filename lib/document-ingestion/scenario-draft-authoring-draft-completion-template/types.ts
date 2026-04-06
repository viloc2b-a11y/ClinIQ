export type ScenarioDraftAuthoringDraftCompletionTemplateFields = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
  isFinalized: boolean
}

export type ScenarioDraftAuthoringDraftCompletionTemplate = {
  completionReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  completionTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  completionFields: ScenarioDraftAuthoringDraftCompletionTemplateFields
  summary: {
    hasCompletionTarget: boolean
    completionBlocked: boolean
    completionIsEmpty: boolean
    completionIsFinalized: boolean
  }
}

export type ScenarioDraftAuthoringDraftCompletionTemplateResult = {
  data: {
    draftCompletionTemplate: ScenarioDraftAuthoringDraftCompletionTemplate
  }
  summary: {
    completionReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    completionIsEmpty: boolean
    completionIsFinalized: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
