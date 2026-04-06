import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringKickoffWorkset = {
  worksetCode: string
  worksetPosition: number
  totalItems: number
  startQueuePosition: number | null
  endQueuePosition: number | null
  firstQueueItemCode: string | null
  lastQueueItemCode: string | null
}

export type ScenarioDraftAuthoringKickoffPack = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  firstWorksetCode: string | null
  worksets: ScenarioDraftAuthoringKickoffWorkset[]
  summary: {
    totalWorksets: number
    totalScheduledItems: number
    hasNullFamilyRepresentation: boolean
    firstQueueItemCode: string | null
  }
}

export type ScenarioDraftAuthoringKickoffResult = {
  data: {
    kickoff: ScenarioDraftAuthoringKickoffPack
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    totalWorksets: number
    totalScheduledItems: number
    firstWorksetCode: string | null
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
