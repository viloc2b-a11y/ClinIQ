import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringCommitCard = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
  committed: boolean
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasCommittedTarget: boolean
    commitBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringCommitCardResult = {
  data: {
    commitCard: ScenarioDraftAuthoringCommitCard
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
