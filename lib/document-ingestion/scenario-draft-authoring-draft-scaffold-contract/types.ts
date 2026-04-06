export type ScenarioDraftAuthoringDraftScaffold = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
}

export type ScenarioDraftAuthoringDraftScaffoldContract = {
  scaffoldReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  scaffoldTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  scaffold: ScenarioDraftAuthoringDraftScaffold
  summary: {
    hasScaffoldTarget: boolean
    scaffoldBlocked: boolean
    scaffoldIsEmpty: boolean
  }
}

export type ScenarioDraftAuthoringDraftScaffoldContractResult = {
  data: {
    draftScaffoldContract: ScenarioDraftAuthoringDraftScaffoldContract
  }
  summary: {
    scaffoldReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    scaffoldIsEmpty: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
