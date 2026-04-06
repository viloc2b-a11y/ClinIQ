import type { ScenarioDraftAuthoringExecutionCorridorMarkerResult } from "../scenario-draft-authoring-execution-corridor-marker/types"
import type { ScenarioDraftAuthoringExecutionChannelCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionChannelCapsule(
  executionCorridorMarkerResult: ScenarioDraftAuthoringExecutionCorridorMarkerResult,
): ScenarioDraftAuthoringExecutionChannelCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionChannelCapsuleResult["warnings"] = []

  const executionCorridorMarker = executionCorridorMarkerResult.data.executionCorridorMarker

  const channelActive = executionCorridorMarker.corridorActive
  const sessionCode = executionCorridorMarker.sessionCode
  const worksetCode = executionCorridorMarker.worksetCode
  const queueItemCode = executionCorridorMarker.queueItemCode
  const remainingSessionCount = executionCorridorMarker.remainingSessionCount
  const totalPlannedItems = executionCorridorMarker.totalPlannedItems

  const hasChannelTarget = sessionCode !== null
  const channelBlocked = !channelActive

  if (!channelActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CHANNEL_BLOCKED",
      message: "Scenario draft authoring execution channel capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasChannelTarget) {
    warnings.push({
      code: "NO_EXECUTION_CHANNEL_TARGET",
      message: "No execution channel target is available because no execution-corridor session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionChannelCapsule: {
        channelActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasChannelTarget,
          channelBlocked,
        },
      },
    },
    summary: {
      channelActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
