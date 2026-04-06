import type { ScenarioDraftAuthoringExecutionLaneMarkerResult } from "../scenario-draft-authoring-execution-lane-marker/types"
import type { ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult } from "./types"

export function buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
  executionLaneMarkerResult: ScenarioDraftAuthoringExecutionLaneMarkerResult,
): ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult {
  const warnings: ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult["warnings"] = []

  const executionLaneMarker = executionLaneMarkerResult.data.executionLaneMarker

  const readyForAuthoring = executionLaneMarker.laneActive
  const sessionCode = executionLaneMarker.sessionCode
  const worksetCode = executionLaneMarker.worksetCode
  const queueItemCode = executionLaneMarker.queueItemCode
  const remainingSessionCount = executionLaneMarker.remainingSessionCount
  const totalPlannedItems = executionLaneMarker.totalPlannedItems

  const hasAuthoringTarget = sessionCode !== null
  const authoringBlocked = !readyForAuthoring

  if (!readyForAuthoring) {
    warnings.push({
      code: "AUTHORING_READY_OUTPUT_BLOCKED",
      message: "Scenario draft authoring ready output marker is not active for downstream authoring consumption.",
      severity: "warning",
    })
  }

  if (!hasAuthoringTarget) {
    warnings.push({
      code: "NO_AUTHORING_READY_OUTPUT_TARGET",
      message: "No authoring-ready output target is available because no execution-lane session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      authoringReadyOutputMarker: {
        readyForAuthoring,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasAuthoringTarget,
          authoringBlocked,
        },
      },
    },
    summary: {
      readyForAuthoring,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
