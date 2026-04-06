import type { ScenarioDraftAuthoringExecutionStreamMarkerResult } from "../scenario-draft-authoring-execution-stream-marker/types"
import type { ScenarioDraftAuthoringExecutionFlowCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionFlowCapsule(
  executionStreamMarkerResult: ScenarioDraftAuthoringExecutionStreamMarkerResult,
): ScenarioDraftAuthoringExecutionFlowCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionFlowCapsuleResult["warnings"] = []

  const executionStreamMarker = executionStreamMarkerResult.data.executionStreamMarker

  const flowActive = executionStreamMarker.streamActive
  const sessionCode = executionStreamMarker.sessionCode
  const worksetCode = executionStreamMarker.worksetCode
  const queueItemCode = executionStreamMarker.queueItemCode
  const remainingSessionCount = executionStreamMarker.remainingSessionCount
  const totalPlannedItems = executionStreamMarker.totalPlannedItems

  const hasFlowTarget = sessionCode !== null
  const flowBlocked = !flowActive

  if (!flowActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_FLOW_BLOCKED",
      message: "Scenario draft authoring execution flow capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasFlowTarget) {
    warnings.push({
      code: "NO_EXECUTION_FLOW_TARGET",
      message: "No execution flow target is available because no execution-stream session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionFlowCapsule: {
        flowActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasFlowTarget,
          flowBlocked,
        },
      },
    },
    summary: {
      flowActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
