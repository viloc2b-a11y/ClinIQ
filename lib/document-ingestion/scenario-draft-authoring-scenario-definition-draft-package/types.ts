export type ScenarioDraftAuthoringScenarioDefinitionDraftPackagePayload = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringScenarioDefinitionDraftPackage = {
  packageReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  packageTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  draftPackagePayload: ScenarioDraftAuthoringScenarioDefinitionDraftPackagePayload
  summary: {
    hasPackageTarget: boolean
    packageBlocked: boolean
    packageIsEmpty: boolean
    packageMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult = {
  data: {
    scenarioDefinitionDraftPackage: ScenarioDraftAuthoringScenarioDefinitionDraftPackage
  }
  summary: {
    packageReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    packageIsEmpty: boolean
    packageMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
