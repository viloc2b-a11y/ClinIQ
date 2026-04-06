import type { ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult } from "../scenario-draft-authoring-authoring-ready-output-marker/types"
import type { ScenarioDraftAuthoringWorkPacketResult } from "./types"

export function buildScenarioDraftAuthoringWorkPacket(
  authoringReadyOutputMarkerResult: ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult,
): ScenarioDraftAuthoringWorkPacketResult {
  const warnings: ScenarioDraftAuthoringWorkPacketResult["warnings"] = []

  const authoringReadyOutputMarker =
    authoringReadyOutputMarkerResult.data.authoringReadyOutputMarker

  const packetReady = authoringReadyOutputMarker.readyForAuthoring
  const sessionCode = authoringReadyOutputMarker.sessionCode
  const worksetCode = authoringReadyOutputMarker.worksetCode
  const queueItemCode = authoringReadyOutputMarker.queueItemCode
  const remainingSessionCount = authoringReadyOutputMarker.remainingSessionCount
  const totalPlannedItems = authoringReadyOutputMarker.totalPlannedItems

  const hasPacketTarget = queueItemCode !== null
  const packetBlocked = !packetReady

  if (!packetReady) {
    warnings.push({
      code: "AUTHORING_WORK_PACKET_BLOCKED",
      message: "Scenario draft authoring work packet is not ready for downstream authoring use.",
      severity: "warning",
    })
  }

  if (!hasPacketTarget) {
    warnings.push({
      code: "NO_AUTHORING_WORK_PACKET_TARGET",
      message: "No authoring work packet target is available because no queue item target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      workPacket: {
        packetReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        packetTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        summary: {
          hasPacketTarget,
          packetBlocked,
        },
      },
    },
    summary: {
      packetReady,
      sessionCode,
      queueItemCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
