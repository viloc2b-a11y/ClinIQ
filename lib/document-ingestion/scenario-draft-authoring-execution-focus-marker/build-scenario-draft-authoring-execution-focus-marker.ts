import type { ScenarioDraftAuthoringExecutionRouteCapsuleResult } from "../scenario-draft-authoring-execution-route-capsule/types"
import type { ScenarioDraftAuthoringExecutionFocusMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionFocusMarker(
  executionRouteCapsuleResult: ScenarioDraftAuthoringExecutionRouteCapsuleResult,
): ScenarioDraftAuthoringExecutionFocusMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionFocusMarkerResult["warnings"] = []

  const executionRouteCapsule = executionRouteCapsuleResult.data.executionRouteCapsule

  const focusActive = executionRouteCapsule.routeActive
  const sessionCode = executionRouteCapsule.sessionCode
  const worksetCode = executionRouteCapsule.worksetCode
  const queueItemCode = executionRouteCapsule.queueItemCode
  const remainingSessionCount = executionRouteCapsule.remainingSessionCount
  const totalPlannedItems = executionRouteCapsule.totalPlannedItems

  const hasFocusTarget = sessionCode !== null
  const focusBlocked = !focusActive

  if (!focusActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_FOCUS_BLOCKED",
      message: "Scenario draft authoring execution focus marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasFocusTarget) {
    warnings.push({
      code: "NO_EXECUTION_FOCUS_TARGET",
      message: "No execution focus target is available because no execution-route session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionFocusMarker: {
        focusActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasFocusTarget,
          focusBlocked,
        },
      },
    },
    summary: {
      focusActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
