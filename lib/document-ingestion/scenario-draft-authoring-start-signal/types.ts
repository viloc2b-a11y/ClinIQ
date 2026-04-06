import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringStartSignal = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasStartTarget: boolean
    startBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringStartSignalResult = {
  data: {
    startSignal: ScenarioDraftAuthoringStartSignal
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    launchReady: boolean
    startNow: boolean
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
