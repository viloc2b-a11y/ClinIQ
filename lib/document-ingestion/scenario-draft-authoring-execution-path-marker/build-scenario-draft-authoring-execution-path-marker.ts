import type { ScenarioDraftAuthoringExecutionFlowCapsuleResult } from "../scenario-draft-authoring-execution-flow-capsule/types"
import type { ScenarioDraftAuthoringExecutionPathMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionPathMarker(
  executionFlowCapsuleResult: ScenarioDraftAuthoringExecutionFlowCapsuleResult,
): ScenarioDraftAuthoringExecutionPathMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionPathMarkerResult["warnings"] = []

  const executionFlowCapsule = executionFlowCapsuleResult.data.executionFlowCapsule

  const pathActive = executionFlowCapsule.flowActive
  const sessionCode = executionFlowCapsule.sessionCode
  const worksetCode = executionFlowCapsule.worksetCode
  const queueItemCode = executionFlowCapsule.queueItemCode
  const remainingSessionCount = executionFlowCapsule.remainingSessionCount
  const totalPlannedItems = executionFlowCapsule.totalPlannedItems

  const hasPathTarget = sessionCode !== null
  const pathBlocked = !pathActive

  if (!pathActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_PATH_BLOCKED",
      message: "Scenario draft authoring execution path marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasPathTarget) {
    warnings.push({
      code: "NO_EXECUTION_PATH_TARGET",
      message: "No execution path target is available because no execution-flow session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionPathMarker: {
        pathActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasPathTarget,
          pathBlocked,
        },
      },
    },
    summary: {
      pathActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
