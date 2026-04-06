import type { ScenarioDraftAuthoringControlSnapshotResult } from "../scenario-draft-authoring-control-snapshot/types"
import type { ScenarioDraftAuthoringLaunchPacketResult } from "./types"

export function buildScenarioDraftAuthoringLaunchPacket(
  controlSnapshotResult: ScenarioDraftAuthoringControlSnapshotResult,
): ScenarioDraftAuthoringLaunchPacketResult {
  const warnings: ScenarioDraftAuthoringLaunchPacketResult["warnings"] = []

  const snapshot = controlSnapshotResult.data.controlSnapshot

  const readinessStatus = controlSnapshotResult.summary.readinessStatus
  const kickoffReady = controlSnapshotResult.summary.kickoffReady
  const firstLaunchSessionCode = snapshot.firstActionableSessionCode
  const firstLaunchWorksetCode = snapshot.firstActionableWorksetCode
  const firstLaunchQueueItemCode = snapshot.firstActionableQueueItemCode
  const remainingSessionCount = snapshot.remainingSessionCount
  const totalPlannedItems = snapshot.totalPlannedItems

  const hasLaunchTarget = firstLaunchSessionCode !== null
  const launchReady = kickoffReady && hasLaunchTarget
  const launchBlocked = !launchReady

  if (!launchReady) {
    warnings.push({
      code: "AUTHORING_LAUNCH_NOT_READY",
      message: "Scenario draft authoring launch packet is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_LAUNCH_READY_WITH_WARNINGS",
      message: "Scenario draft authoring launch packet can start but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasLaunchTarget) {
    warnings.push({
      code: "NO_AUTHORING_LAUNCH_TARGET",
      message: "No launch target is available because no actionable authoring session exists.",
      severity: "info",
    })
  }

  return {
    data: {
      launchPacket: {
        readinessStatus,
        kickoffReady,
        launchReady,
        firstLaunchSessionCode,
        firstLaunchWorksetCode,
        firstLaunchQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasLaunchTarget,
          launchBlocked,
          totalSessions: remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      launchReady,
      firstLaunchSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
