export type ScenarioDraftAuthoringFinalizedDraftHandoffContractPayload = {
  title: string | null
  objective: string | null
  trigger: string | null
  expectedBehavior: string | null
  edgeCases: string[]
  completionNotes: string | null
}

export type ScenarioDraftAuthoringFinalizedDraftHandoffContract = {
  handoffReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  handoffTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  handoffPayload: ScenarioDraftAuthoringFinalizedDraftHandoffContractPayload
  summary: {
    hasHandoffTarget: boolean
    handoffBlocked: boolean
    handoffIsEmpty: boolean
    handoffMarkedComplete: boolean
  }
}

export type ScenarioDraftAuthoringFinalizedDraftHandoffContractResult = {
  data: {
    finalizedDraftHandoffContract: ScenarioDraftAuthoringFinalizedDraftHandoffContract
  }
  summary: {
    handoffReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    handoffIsEmpty: boolean
    handoffMarkedComplete: boolean
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
