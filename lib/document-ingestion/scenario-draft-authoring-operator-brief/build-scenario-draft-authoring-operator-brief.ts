import type { ScenarioDraftAuthoringLaunchPacketResult } from "../scenario-draft-authoring-launch-packet/types"
import type { ScenarioDraftAuthoringOperatorBriefResult } from "./types"

export function buildScenarioDraftAuthoringOperatorBrief(
  launchPacketResult: ScenarioDraftAuthoringLaunchPacketResult,
): ScenarioDraftAuthoringOperatorBriefResult {
  const warnings: ScenarioDraftAuthoringOperatorBriefResult["warnings"] = []

  const launchPacket = launchPacketResult.data.launchPacket

  const readinessStatus = launchPacketResult.summary.readinessStatus
  const kickoffReady = launchPacketResult.summary.kickoffReady
  const launchReady = launchPacketResult.summary.launchReady
  const firstSessionCode = launchPacket.firstLaunchSessionCode
  const firstWorksetCode = launchPacket.firstLaunchWorksetCode
  const firstQueueItemCode = launchPacket.firstLaunchQueueItemCode
  const remainingSessionCount = launchPacket.remainingSessionCount
  const totalPlannedItems = launchPacket.totalPlannedItems

  const hasOperatorStartPoint = firstSessionCode !== null
  const launchBlocked = !launchReady

  if (!launchReady) {
    warnings.push({
      code: "AUTHORING_OPERATOR_BRIEF_NOT_READY",
      message: "Scenario draft authoring operator brief is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_OPERATOR_BRIEF_READY_WITH_WARNINGS",
      message: "Scenario draft authoring operator brief can start but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasOperatorStartPoint) {
    warnings.push({
      code: "NO_OPERATOR_START_POINT",
      message: "No operator start point is available because no launch session exists.",
      severity: "info",
    })
  }

  return {
    data: {
      operatorBrief: {
        readinessStatus,
        kickoffReady,
        launchReady,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasOperatorStartPoint,
          launchBlocked,
          totalSessions: remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      launchReady,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
