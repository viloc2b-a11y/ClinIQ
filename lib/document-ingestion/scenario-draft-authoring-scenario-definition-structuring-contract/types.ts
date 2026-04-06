export type ScenarioDraftAuthoringScenarioDefinitionStructuringContractPayload = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringScenarioDefinitionStructuringContract = {
  structuringReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  structuringTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  structuringPayload: ScenarioDraftAuthoringScenarioDefinitionStructuringContractPayload
  summary: {
    hasStructuringTarget: boolean
    structuringBlocked: boolean
    structuringIsEmpty: boolean
    structuringMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult = {
  data: {
    scenarioDefinitionStructuringContract: ScenarioDraftAuthoringScenarioDefinitionStructuringContract
  }
  summary: {
    structuringReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    structuringIsEmpty: boolean
    structuringMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
