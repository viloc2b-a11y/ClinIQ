import type { ScenarioDraftAuthoringLiveExecutionMarkerResult } from "../scenario-draft-authoring-live-execution-marker/types"
import type { ScenarioDraftAuthoringInProgressExecutionSealResult } from "./types"

export function buildScenarioDraftAuthoringInProgressExecutionSeal(
  liveExecutionMarkerResult: ScenarioDraftAuthoringLiveExecutionMarkerResult,
): ScenarioDraftAuthoringInProgressExecutionSealResult {
  const warnings: ScenarioDraftAuthoringInProgressExecutionSealResult["warnings"] = []

  const liveExecutionMarker = liveExecutionMarkerResult.data.liveExecutionMarker

  const inProgress = liveExecutionMarker.live
  const sessionCode = liveExecutionMarker.sessionCode
  const worksetCode = liveExecutionMarker.worksetCode
  const queueItemCode = liveExecutionMarker.queueItemCode
  const remainingSessionCount = liveExecutionMarker.remainingSessionCount
  const totalPlannedItems = liveExecutionMarker.totalPlannedItems

  const hasInProgressTarget = sessionCode !== null
  const inProgressBlocked = !inProgress

  if (!inProgress) {
    warnings.push({
      code: "AUTHORING_IN_PROGRESS_EXECUTION_BLOCKED",
      message: "Scenario draft authoring in-progress execution seal is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasInProgressTarget) {
    warnings.push({
      code: "NO_IN_PROGRESS_EXECUTION_TARGET",
      message: "No in-progress execution target is available because no live execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      inProgressExecutionSeal: {
        inProgress,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasInProgressTarget,
          inProgressBlocked,
        },
      },
    },
    summary: {
      inProgress,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
