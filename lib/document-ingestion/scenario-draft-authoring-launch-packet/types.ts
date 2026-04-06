import type { ScenarioDraftAuthoringReadinessStatus } from "../scenario-draft-authoring-readiness/types"

export type ScenarioDraftAuthoringLaunchPacket = {
  readinessStatus: ScenarioDraftAuthoringReadinessStatus
  kickoffReady: boolean
  launchReady: boolean
  firstLaunchSessionCode: string | null
  firstLaunchWorksetCode: string | null
  firstLaunchQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  summary: {
    hasLaunchTarget: boolean
    launchBlocked: boolean
    totalSessions: number
  }
}

export type ScenarioDraftAuthoringLaunchPacketResult = {
  data: {
    launchPacket: ScenarioDraftAuthoringLaunchPacket
  }
  summary: {
    readinessStatus: ScenarioDraftAuthoringReadinessStatus
    kickoffReady: boolean
    launchReady: boolean
    firstLaunchSessionCode: string | null
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
