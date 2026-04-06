export type ScenarioDraftAuthoringDraftInputTemplateFields = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
}

export type ScenarioDraftAuthoringDraftInputTemplate = {
  templateReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  templateTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  templateFields: ScenarioDraftAuthoringDraftInputTemplateFields
  summary: {
    hasTemplateTarget: boolean
    templateBlocked: boolean
    templateIsEmpty: boolean
  }
}

export type ScenarioDraftAuthoringDraftInputTemplateResult = {
  data: {
    draftInputTemplate: ScenarioDraftAuthoringDraftInputTemplate
  }
  summary: {
    templateReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    templateIsEmpty: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
