export type ScenarioDraftAuthoringScenarioDefinitionShapeTemplatePayload = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringScenarioDefinitionShapeTemplate = {
  shapeReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  shapeTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  shapePayload: ScenarioDraftAuthoringScenarioDefinitionShapeTemplatePayload
  summary: {
    hasShapeTarget: boolean
    shapeBlocked: boolean
    shapeIsEmpty: boolean
    shapeMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult = {
  data: {
    scenarioDefinitionShapeTemplate: ScenarioDraftAuthoringScenarioDefinitionShapeTemplate
  }
  summary: {
    shapeReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    shapeIsEmpty: boolean
    shapeMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
