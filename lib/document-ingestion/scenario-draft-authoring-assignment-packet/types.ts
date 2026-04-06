export type ScenarioDraftAuthoringAssignmentPacket = {
  assignmentReady: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  assignmentTarget: {
    sessionCode: string | null
    worksetCode: string | null
    queueItemCode: string | null
  }
  summary: {
    hasAssignmentTarget: boolean
    assignmentBlocked: boolean
  }
}

export type ScenarioDraftAuthoringAssignmentPacketResult = {
  data: {
    assignmentPacket: ScenarioDraftAuthoringAssignmentPacket
  }
  summary: {
    assignmentReady: boolean
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
