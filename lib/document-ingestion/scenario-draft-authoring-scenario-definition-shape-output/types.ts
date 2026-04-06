export type ScenarioDraftAuthoringScenarioDefinitionShapeOutputPayload = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringScenarioDefinitionShapeOutput = {
  shapeOutputReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  shapeOutputTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  shapeOutputPayload: ScenarioDraftAuthoringScenarioDefinitionShapeOutputPayload
  summary: {
    hasShapeOutputTarget: boolean
    shapeOutputBlocked: boolean
    shapeOutputIsEmpty: boolean
    shapeOutputMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult = {
  data: {
    scenarioDefinitionShapeOutput: ScenarioDraftAuthoringScenarioDefinitionShapeOutput
  }
  summary: {
    shapeOutputReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    shapeOutputIsEmpty: boolean
    shapeOutputMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
