import type { ScenarioDraftAuthoringExecutionFocusCapsuleResult } from "../scenario-draft-authoring-execution-focus-capsule/types"
import type { ScenarioDraftAuthoringLiveExecutionMarkerResult } from "./types"

export function buildScenarioDraftAuthoringLiveExecutionMarker(
  executionFocusCapsuleResult: ScenarioDraftAuthoringExecutionFocusCapsuleResult,
): ScenarioDraftAuthoringLiveExecutionMarkerResult {
  const warnings: ScenarioDraftAuthoringLiveExecutionMarkerResult["warnings"] = []

  const executionFocusCapsule = executionFocusCapsuleResult.data.executionFocusCapsule

  const live = executionFocusCapsule.focused
  const sessionCode = executionFocusCapsule.sessionCode
  const worksetCode = executionFocusCapsule.worksetCode
  const queueItemCode = executionFocusCapsule.queueItemCode
  const remainingSessionCount = executionFocusCapsule.remainingSessionCount
  const totalPlannedItems = executionFocusCapsule.totalPlannedItems

  const hasLiveTarget = sessionCode !== null
  const liveBlocked = !live

  if (!live) {
    warnings.push({
      code: "AUTHORING_LIVE_EXECUTION_BLOCKED",
      message: "Scenario draft authoring live execution marker is not live and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasLiveTarget) {
    warnings.push({
      code: "NO_LIVE_EXECUTION_TARGET",
      message: "No live execution target is available because no execution focus session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      liveExecutionMarker: {
        live,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasLiveTarget,
          liveBlocked,
        },
      },
    },
    summary: {
      live,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
