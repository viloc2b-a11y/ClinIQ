import type { ScenarioDraftAuthoringStartSignalResult } from "../scenario-draft-authoring-start-signal/types"
import type { ScenarioDraftAuthoringStartPacketResult } from "./types"

export function buildScenarioDraftAuthoringStartPacket(
  startSignalResult: ScenarioDraftAuthoringStartSignalResult,
): ScenarioDraftAuthoringStartPacketResult {
  const warnings: ScenarioDraftAuthoringStartPacketResult["warnings"] = []

  const startSignal = startSignalResult.data.startSignal

  const readinessStatus = startSignalResult.summary.readinessStatus
  const kickoffReady = startSignalResult.summary.kickoffReady
  const launchReady = startSignalResult.summary.launchReady
  const startNow = startSignalResult.summary.startNow
  const firstSessionCode = startSignal.firstSessionCode
  const firstWorksetCode = startSignal.firstWorksetCode
  const firstQueueItemCode = startSignal.firstQueueItemCode
  const remainingSessionCount = startSignal.remainingSessionCount
  const totalPlannedItems = startSignal.totalPlannedItems

  const hasStartPacketTarget = firstSessionCode !== null
  const startReady = startNow && hasStartPacketTarget
  const startBlocked = !startReady

  if (!startReady) {
    warnings.push({
      code: "AUTHORING_START_PACKET_NOT_READY",
      message: "Scenario draft authoring start packet is not ready to begin.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_START_PACKET_READY_WITH_WARNINGS",
      message: "Scenario draft authoring start packet can begin but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasStartPacketTarget) {
    warnings.push({
      code: "NO_AUTHORING_START_PACKET_TARGET",
      message: "No start packet target is available because no start target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      startPacket: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        startReady,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasStartPacketTarget,
          startBlocked,
          totalSessions: remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      launchReady,
      startNow,
      startReady,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
