import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringFirstMoveSnapshot = {
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
  firstMoveReady: boolean
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasFirstMoveTarget: boolean
    firstMoveBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringFirstMoveResult = {
  data: {
    firstMoveSnapshot: ScenarioDraftAuthoringFirstMoveSnapshot
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
    firstMoveReady: boolean
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
