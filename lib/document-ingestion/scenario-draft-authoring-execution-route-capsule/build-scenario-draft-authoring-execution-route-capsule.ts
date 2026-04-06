import type { ScenarioDraftAuthoringExecutionPathMarkerResult } from "../scenario-draft-authoring-execution-path-marker/types"
import type { ScenarioDraftAuthoringExecutionRouteCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionRouteCapsule(
  executionPathMarkerResult: ScenarioDraftAuthoringExecutionPathMarkerResult,
): ScenarioDraftAuthoringExecutionRouteCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionRouteCapsuleResult["warnings"] = []

  const executionPathMarker = executionPathMarkerResult.data.executionPathMarker

  const routeActive = executionPathMarker.pathActive
  const sessionCode = executionPathMarker.sessionCode
  const worksetCode = executionPathMarker.worksetCode
  const queueItemCode = executionPathMarker.queueItemCode
  const remainingSessionCount = executionPathMarker.remainingSessionCount
  const totalPlannedItems = executionPathMarker.totalPlannedItems

  const hasRouteTarget = sessionCode !== null
  const routeBlocked = !routeActive

  if (!routeActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_ROUTE_BLOCKED",
      message: "Scenario draft authoring execution route capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasRouteTarget) {
    warnings.push({
      code: "NO_EXECUTION_ROUTE_TARGET",
      message: "No execution route target is available because no execution-path session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionRouteCapsule: {
        routeActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasRouteTarget,
          routeBlocked,
        },
      },
    },
    summary: {
      routeActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
