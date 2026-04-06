import type { ScenarioDraftAuthoringStartPacketResult } from "../scenario-draft-authoring-start-packet/types"
import type { ScenarioDraftAuthoringImmediateActionResult } from "./types"

export function buildScenarioDraftAuthoringImmediateAction(
  startPacketResult: ScenarioDraftAuthoringStartPacketResult,
): ScenarioDraftAuthoringImmediateActionResult {
  const warnings: ScenarioDraftAuthoringImmediateActionResult["warnings"] = []

  const startPacket = startPacketResult.data.startPacket

  const readinessStatus = startPacketResult.summary.readinessStatus
  const kickoffReady = startPacketResult.summary.kickoffReady
  const launchReady = startPacketResult.summary.launchReady
  const startNow = startPacketResult.summary.startNow
  const startReady = startPacketResult.summary.startReady
  const firstSessionCode = startPacket.firstSessionCode
  const firstWorksetCode = startPacket.firstWorksetCode
  const firstQueueItemCode = startPacket.firstQueueItemCode
  const remainingSessionCount = startPacket.remainingSessionCount
  const totalPlannedItems = startPacket.totalPlannedItems

  const hasImmediateActionTarget = firstSessionCode !== null
  const actNow = startReady && hasImmediateActionTarget
  const actionBlocked = !actNow

  if (!actNow) {
    warnings.push({
      code: "AUTHORING_IMMEDIATE_ACTION_NOT_READY",
      message: "Scenario draft authoring immediate action card is not ready to execute.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_IMMEDIATE_ACTION_READY_WITH_WARNINGS",
      message: "Scenario draft authoring immediate action can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasImmediateActionTarget) {
    warnings.push({
      code: "NO_IMMEDIATE_ACTION_TARGET",
      message: "No immediate action target is available because no start packet target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      immediateActionCard: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        startReady,
        actNow,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasImmediateActionTarget,
          actionBlocked,
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
      actNow,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
