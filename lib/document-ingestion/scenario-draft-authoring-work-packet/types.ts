export type ScenarioDraftAuthoringWorkPacket = {
  packetReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  packetTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  summary: {
    hasPacketTarget: boolean
    packetBlocked: boolean
  }
}

export type ScenarioDraftAuthoringWorkPacketResult = {
  data: {
    workPacket: ScenarioDraftAuthoringWorkPacket
  }
  summary: {
    packetReady: boolean
    sessionCode: string | null
    queueItemCode: string | null
    remainingSessionCount: number
    totalPlannedItems: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
