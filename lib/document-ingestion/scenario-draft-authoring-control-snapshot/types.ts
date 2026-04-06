import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringControlSnapshot = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  firstActionableSessionCode: string | null
  firstActionableWorksetCode: string | null
  firstActionableQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    totalSessions: number
    hasActionableSession: boolean
    firstSessionIsActionable: boolean
  }
}

export type ScenarioDraftAuthoringControlSnapshotResult = {
  data: {
    controlSnapshot: ScenarioDraftAuthoringControlSnapshot
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    firstActionableSessionCode: string | null
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
