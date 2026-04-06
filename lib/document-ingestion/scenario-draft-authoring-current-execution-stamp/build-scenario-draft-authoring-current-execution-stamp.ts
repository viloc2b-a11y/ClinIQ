import type { ScenarioDraftAuthoringInProgressExecutionSealResult } from "../scenario-draft-authoring-in-progress-execution-seal/types"
import type { ScenarioDraftAuthoringCurrentExecutionStampResult } from "./types"

export function buildScenarioDraftAuthoringCurrentExecutionStamp(
  inProgressExecutionSealResult: ScenarioDraftAuthoringInProgressExecutionSealResult,
): ScenarioDraftAuthoringCurrentExecutionStampResult {
  const warnings: ScenarioDraftAuthoringCurrentExecutionStampResult["warnings"] = []

  const inProgressExecutionSeal = inProgressExecutionSealResult.data.inProgressExecutionSeal

  const current = inProgressExecutionSeal.inProgress
  const sessionCode = inProgressExecutionSeal.sessionCode
  const worksetCode = inProgressExecutionSeal.worksetCode
  const queueItemCode = inProgressExecutionSeal.queueItemCode
  const remainingSessionCount = inProgressExecutionSeal.remainingSessionCount
  const totalPlannedItems = inProgressExecutionSeal.totalPlannedItems

  const hasCurrentTarget = sessionCode !== null
  const currentBlocked = !current

  if (!current) {
    warnings.push({
      code: "AUTHORING_CURRENT_EXECUTION_BLOCKED",
      message: "Scenario draft authoring current execution stamp is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasCurrentTarget) {
    warnings.push({
      code: "NO_CURRENT_EXECUTION_TARGET",
      message: "No current execution target is available because no in-progress execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      currentExecutionStamp: {
        current,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasCurrentTarget,
          currentBlocked,
        },
      },
    },
    summary: {
      current,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
