import type { ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult } from "../scenario-draft-authoring-immediate-live-execution-marker/types"
import type { ScenarioDraftAuthoringExecutionContinuationTokenResult } from "./types"

export function buildScenarioDraftAuthoringExecutionContinuationToken(
  immediateLiveExecutionMarkerResult: ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult,
): ScenarioDraftAuthoringExecutionContinuationTokenResult {
  const warnings: ScenarioDraftAuthoringExecutionContinuationTokenResult["warnings"] = []

  const immediateLiveExecutionMarker =
    immediateLiveExecutionMarkerResult.data.immediateLiveExecutionMarker

  const continuationActive = immediateLiveExecutionMarker.immediateLive
  const sessionCode = immediateLiveExecutionMarker.sessionCode
  const worksetCode = immediateLiveExecutionMarker.worksetCode
  const queueItemCode = immediateLiveExecutionMarker.queueItemCode
  const remainingSessionCount = immediateLiveExecutionMarker.remainingSessionCount
  const totalPlannedItems = immediateLiveExecutionMarker.totalPlannedItems

  const hasContinuationTarget = sessionCode !== null
  const continuationBlocked = !continuationActive

  if (!continuationActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CONTINUATION_BLOCKED",
      message: "Scenario draft authoring execution continuation token is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasContinuationTarget) {
    warnings.push({
      code: "NO_EXECUTION_CONTINUATION_TARGET",
      message: "No execution-continuation target is available because no immediate-live execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionContinuationToken: {
        continuationActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasContinuationTarget,
          continuationBlocked,
        },
      },
    },
    summary: {
      continuationActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
