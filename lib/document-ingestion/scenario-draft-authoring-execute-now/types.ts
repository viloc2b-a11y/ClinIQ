import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringExecuteNowCard = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
  committed: boolean
  finalGo: boolean
  readyToExecute: boolean
  executionApproved: boolean
  executeNow: boolean
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasExecuteNowTarget: boolean
    executeNowBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringExecuteNowResult = {
  data: {
    executeNowCard: ScenarioDraftAuthoringExecuteNowCard
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    launchReady: boolean
    startNow: boolean
    startReady: boolean
    actNow: boolean
    confirmed: boolean
    committed: boolean
    finalGo: boolean
    readyToExecute: boolean
    executionApproved: boolean
    executeNow: boolean
    firstSessionCode: string | null
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
