import type { ScenarioDraftAuthoringExecutionSuccessorTokenResult } from "../scenario-draft-authoring-execution-successor-token/types"
import type { ScenarioDraftAuthoringExecutionContinuityCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionContinuityCapsule(
  executionSuccessorTokenResult: ScenarioDraftAuthoringExecutionSuccessorTokenResult,
): ScenarioDraftAuthoringExecutionContinuityCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionContinuityCapsuleResult["warnings"] = []

  const executionSuccessorToken =
    executionSuccessorTokenResult.data.executionSuccessorToken

  const continuityActive = executionSuccessorToken.successorActive
  const sessionCode = executionSuccessorToken.sessionCode
  const worksetCode = executionSuccessorToken.worksetCode
  const queueItemCode = executionSuccessorToken.queueItemCode
  const remainingSessionCount = executionSuccessorToken.remainingSessionCount
  const totalPlannedItems = executionSuccessorToken.totalPlannedItems

  const hasContinuityTarget = sessionCode !== null
  const continuityBlocked = !continuityActive

  if (!continuityActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CONTINUITY_BLOCKED",
      message: "Scenario draft authoring execution continuity capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasContinuityTarget) {
    warnings.push({
      code: "NO_EXECUTION_CONTINUITY_TARGET",
      message: "No execution continuity target is available because no execution-successor session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionContinuityCapsule: {
        continuityActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasContinuityTarget,
          continuityBlocked,
        },
      },
    },
    summary: {
      continuityActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
