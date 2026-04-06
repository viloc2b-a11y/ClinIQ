import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringHandoffSession = {
  sessionCode: string
  sessionPosition: number
  targetWorksetCode: string
  targetWorksetPosition: number
  totalItems: number
  startQueuePosition: number | null
  endQueuePosition: number | null
  firstQueueItemCode: string | null
  lastQueueItemCode: string | null
  isFirstSession: boolean
}

export type ScenarioDraftAuthoringHandoffBundle = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  firstSessionCode: string | null
  sessions: ScenarioDraftAuthoringHandoffSession[]
  summary: {
    totalSessions: number
    totalPlannedItems: number
    firstWorksetCode: string | null
    firstQueueItemCode: string | null
  }
}

export type ScenarioDraftAuthoringHandoffResult = {
  data: {
    handoff: ScenarioDraftAuthoringHandoffBundle
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    totalSessions: number
    totalPlannedItems: number
    firstSessionCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
