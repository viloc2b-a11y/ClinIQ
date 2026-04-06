import type { ScenarioDraftAuthoringExecutionContinuityCapsuleResult } from "../scenario-draft-authoring-execution-continuity-capsule/types"
import type { ScenarioDraftAuthoringExecutionChainMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionChainMarker(
  executionContinuityCapsuleResult: ScenarioDraftAuthoringExecutionContinuityCapsuleResult,
): ScenarioDraftAuthoringExecutionChainMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionChainMarkerResult["warnings"] = []

  const executionContinuityCapsule =
    executionContinuityCapsuleResult.data.executionContinuityCapsule

  const chainActive = executionContinuityCapsule.continuityActive
  const sessionCode = executionContinuityCapsule.sessionCode
  const worksetCode = executionContinuityCapsule.worksetCode
  const queueItemCode = executionContinuityCapsule.queueItemCode
  const remainingSessionCount = executionContinuityCapsule.remainingSessionCount
  const totalPlannedItems = executionContinuityCapsule.totalPlannedItems

  const hasChainTarget = sessionCode !== null
  const chainBlocked = !chainActive

  if (!chainActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CHAIN_BLOCKED",
      message: "Scenario draft authoring execution chain marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasChainTarget) {
    warnings.push({
      code: "NO_EXECUTION_CHAIN_TARGET",
      message: "No execution chain target is available because no execution-continuity session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionChainMarker: {
        chainActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasChainTarget,
          chainBlocked,
        },
      },
    },
    summary: {
      chainActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
