import type { ScenarioDraftAuthoringWorkPacketResult } from "../scenario-draft-authoring-work-packet/types"
import type { ScenarioDraftAuthoringAssignmentPacketResult } from "./types"

export function buildScenarioDraftAuthoringAssignmentPacket(
  workPacketResult: ScenarioDraftAuthoringWorkPacketResult,
): ScenarioDraftAuthoringAssignmentPacketResult {
  const warnings: ScenarioDraftAuthoringAssignmentPacketResult["warnings"] = []

  const workPacket = workPacketResult.data.workPacket

  const assignmentReady = workPacket.packetReady
  const sessionCode = workPacket.sessionCode
  const worksetCode = workPacket.worksetCode
  const queueItemCode = workPacket.queueItemCode
  const remainingSessionCount = workPacket.remainingSessionCount
  const totalPlannedItems = workPacket.totalPlannedItems

  const hasAssignmentTarget = queueItemCode !== null
  const assignmentBlocked = !assignmentReady

  if (!assignmentReady) {
    warnings.push({
      code: "AUTHORING_ASSIGNMENT_PACKET_BLOCKED",
      message: "Scenario draft authoring assignment packet is not ready for downstream authoring assignment use.",
      severity: "warning",
    })
  }

  if (!hasAssignmentTarget) {
    warnings.push({
      code: "NO_AUTHORING_ASSIGNMENT_PACKET_TARGET",
      message: "No authoring assignment packet target is available because no queue item target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      assignmentPacket: {
        assignmentReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        assignmentTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        summary: {
          hasAssignmentTarget,
          assignmentBlocked,
        },
      },
    },
    summary: {
      assignmentReady,
      sessionCode,
      queueItemCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
