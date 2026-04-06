import type { ScenarioDraftAuthoringExecutionLaneMarkerResult } from "../scenario-draft-authoring-execution-lane-marker/types"
import type { ScenarioDraftAuthoringExecutionTrackCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionTrackCapsule(
  executionLaneMarkerResult: ScenarioDraftAuthoringExecutionLaneMarkerResult,
): ScenarioDraftAuthoringExecutionTrackCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionTrackCapsuleResult["warnings"] = []

  const executionLaneMarker = executionLaneMarkerResult.data.executionLaneMarker

  const trackActive = executionLaneMarker.laneActive
  const sessionCode = executionLaneMarker.sessionCode
  const worksetCode = executionLaneMarker.worksetCode
  const queueItemCode = executionLaneMarker.queueItemCode
  const remainingSessionCount = executionLaneMarker.remainingSessionCount
  const totalPlannedItems = executionLaneMarker.totalPlannedItems

  const hasTrackTarget = sessionCode !== null
  const trackBlocked = !trackActive

  if (!trackActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_TRACK_BLOCKED",
      message: "Scenario draft authoring execution track capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasTrackTarget) {
    warnings.push({
      code: "NO_EXECUTION_TRACK_TARGET",
      message: "No execution track target is available because no execution-lane session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionTrackCapsule: {
        trackActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasTrackTarget,
          trackBlocked,
        },
      },
    },
    summary: {
      trackActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
