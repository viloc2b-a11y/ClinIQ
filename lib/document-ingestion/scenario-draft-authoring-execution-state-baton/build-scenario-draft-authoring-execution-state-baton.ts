import type { ScenarioDraftAuthoringOngoingExecutionMarkerResult } from "../scenario-draft-authoring-ongoing-execution-marker/types"
import type { ScenarioDraftAuthoringExecutionStateBatonResult } from "./types"

export function buildScenarioDraftAuthoringExecutionStateBaton(
  ongoingExecutionMarkerResult: ScenarioDraftAuthoringOngoingExecutionMarkerResult,
): ScenarioDraftAuthoringExecutionStateBatonResult {
  const warnings: ScenarioDraftAuthoringExecutionStateBatonResult["warnings"] = []

  const ongoingExecutionMarker = ongoingExecutionMarkerResult.data.ongoingExecutionMarker

  const executionStateActive = ongoingExecutionMarker.ongoing
  const sessionCode = ongoingExecutionMarker.sessionCode
  const worksetCode = ongoingExecutionMarker.worksetCode
  const queueItemCode = ongoingExecutionMarker.queueItemCode
  const remainingSessionCount = ongoingExecutionMarker.remainingSessionCount
  const totalPlannedItems = ongoingExecutionMarker.totalPlannedItems

  const hasExecutionStateTarget = sessionCode !== null
  const executionStateBlocked = !executionStateActive

  if (!executionStateActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_STATE_BLOCKED",
      message: "Scenario draft authoring execution state baton is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasExecutionStateTarget) {
    warnings.push({
      code: "NO_EXECUTION_STATE_TARGET",
      message: "No execution-state target is available because no ongoing-execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionStateBaton: {
        executionStateActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasExecutionStateTarget,
          executionStateBlocked,
        },
      },
    },
    summary: {
      executionStateActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
