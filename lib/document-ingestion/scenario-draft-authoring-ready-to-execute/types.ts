import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringReadyToExecuteSnapshot = {
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
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasReadyToExecuteTarget: boolean
    readyToExecuteBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringReadyToExecuteResult = {
  data: {
    readyToExecuteSnapshot: ScenarioDraftAuthoringReadyToExecuteSnapshot
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
