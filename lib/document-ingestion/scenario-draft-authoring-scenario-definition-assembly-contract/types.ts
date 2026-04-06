export type ScenarioDraftAuthoringScenarioDefinitionAssemblyContractPayload = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringScenarioDefinitionAssemblyContract = {
  assemblyReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  assemblyTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  assemblyPayload: ScenarioDraftAuthoringScenarioDefinitionAssemblyContractPayload
  summary: {
    hasAssemblyTarget: boolean
    assemblyBlocked: boolean
    assemblyIsEmpty: boolean
    assemblyMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringScenarioDefinitionAssemblyContractResult = {
  data: {
    scenarioDefinitionAssemblyContract: ScenarioDraftAuthoringScenarioDefinitionAssemblyContract
  }
  summary: {
    assemblyReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    assemblyIsEmpty: boolean
    assemblyMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
