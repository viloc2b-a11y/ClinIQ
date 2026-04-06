import type { ScenarioDraftAuthoringFirstMoveResult } from "../scenario-draft-authoring-first-move/types"
import type { ScenarioDraftAuthoringImmediateExecutionTokenResult } from "./types"

export function buildScenarioDraftAuthoringImmediateExecutionToken(
  firstMoveResult: ScenarioDraftAuthoringFirstMoveResult,
): ScenarioDraftAuthoringImmediateExecutionTokenResult {
  const warnings: ScenarioDraftAuthoringImmediateExecutionTokenResult["warnings"] = []

  const firstMoveSnapshot = firstMoveResult.data.firstMoveSnapshot

  const executionAllowed = firstMoveSnapshot.firstMoveReady
  const sessionCode = firstMoveSnapshot.firstSessionCode
  const worksetCode = firstMoveSnapshot.firstWorksetCode
  const queueItemCode = firstMoveSnapshot.firstQueueItemCode
  const remainingSessionCount = firstMoveSnapshot.remainingSessionCount
  const totalPlannedItems = firstMoveSnapshot.totalPlannedItems

  const hasExecutionTarget = sessionCode !== null
  const executionBlocked = !executionAllowed

  if (!executionAllowed) {
    warnings.push({
      code: "AUTHORING_IMMEDIATE_EXECUTION_NOT_ALLOWED",
      message: "Scenario draft authoring immediate execution token is not allowed to proceed.",
      severity: "warning",
    })
  }

  if (!hasExecutionTarget) {
    warnings.push({
      code: "NO_IMMEDIATE_EXECUTION_TARGET",
      message: "No immediate execution target is available because no first-move session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionToken: {
        executionAllowed,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasExecutionTarget,
          executionBlocked,
        },
      },
    },
    summary: {
      executionAllowed,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
