import type { ScenarioDraftAuthoringExecutionTrackCapsuleResult } from "../scenario-draft-authoring-execution-track-capsule/types"
import type { ScenarioDraftAuthoringExecutionCorridorMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionCorridorMarker(
  executionTrackCapsuleResult: ScenarioDraftAuthoringExecutionTrackCapsuleResult,
): ScenarioDraftAuthoringExecutionCorridorMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionCorridorMarkerResult["warnings"] = []

  const executionTrackCapsule = executionTrackCapsuleResult.data.executionTrackCapsule

  const corridorActive = executionTrackCapsule.trackActive
  const sessionCode = executionTrackCapsule.sessionCode
  const worksetCode = executionTrackCapsule.worksetCode
  const queueItemCode = executionTrackCapsule.queueItemCode
  const remainingSessionCount = executionTrackCapsule.remainingSessionCount
  const totalPlannedItems = executionTrackCapsule.totalPlannedItems

  const hasCorridorTarget = sessionCode !== null
  const corridorBlocked = !corridorActive

  if (!corridorActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CORRIDOR_BLOCKED",
      message: "Scenario draft authoring execution corridor marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasCorridorTarget) {
    warnings.push({
      code: "NO_EXECUTION_CORRIDOR_TARGET",
      message: "No execution corridor target is available because no execution-track session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionCorridorMarker: {
        corridorActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasCorridorTarget,
          corridorBlocked,
        },
      },
    },
    summary: {
      corridorActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
