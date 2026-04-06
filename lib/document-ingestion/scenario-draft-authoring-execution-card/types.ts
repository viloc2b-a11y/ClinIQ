import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringExecutionCard = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  launchReady: boolean
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasExecutionStartPoint: boolean
    executionBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringExecutionCardResult = {
  data: {
    executionCard: ScenarioDraftAuthoringExecutionCard
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    launchReady: boolean
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
