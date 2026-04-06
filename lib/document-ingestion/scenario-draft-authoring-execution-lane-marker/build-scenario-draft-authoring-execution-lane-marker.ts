import type { ScenarioDraftAuthoringExecutionChannelCapsuleResult } from "../scenario-draft-authoring-execution-channel-capsule/types"
import type { ScenarioDraftAuthoringExecutionLaneMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionLaneMarker(
  executionChannelCapsuleResult: ScenarioDraftAuthoringExecutionChannelCapsuleResult,
): ScenarioDraftAuthoringExecutionLaneMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionLaneMarkerResult["warnings"] = []

  const executionChannelCapsule = executionChannelCapsuleResult.data.executionChannelCapsule

  const laneActive = executionChannelCapsule.channelActive
  const sessionCode = executionChannelCapsule.sessionCode
  const worksetCode = executionChannelCapsule.worksetCode
  const queueItemCode = executionChannelCapsule.queueItemCode
  const remainingSessionCount = executionChannelCapsule.remainingSessionCount
  const totalPlannedItems = executionChannelCapsule.totalPlannedItems

  const hasLaneTarget = sessionCode !== null
  const laneBlocked = !laneActive

  if (!laneActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_LANE_BLOCKED",
      message: "Scenario draft authoring execution lane marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasLaneTarget) {
    warnings.push({
      code: "NO_EXECUTION_LANE_TARGET",
      message: "No execution lane target is available because no execution-channel session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionLaneMarker: {
        laneActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasLaneTarget,
          laneBlocked,
        },
      },
    },
    summary: {
      laneActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
