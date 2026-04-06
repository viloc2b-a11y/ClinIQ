import type { ScenarioDraftAuthoringExecutionContinuationTokenResult } from "../scenario-draft-authoring-execution-continuation-token/types"
import type { ScenarioDraftAuthoringSustainedExecutionCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringSustainedExecutionCapsule(
  executionContinuationTokenResult: ScenarioDraftAuthoringExecutionContinuationTokenResult,
): ScenarioDraftAuthoringSustainedExecutionCapsuleResult {
  const warnings: ScenarioDraftAuthoringSustainedExecutionCapsuleResult["warnings"] = []

  const executionContinuationToken =
    executionContinuationTokenResult.data.executionContinuationToken

  const sustained = executionContinuationToken.continuationActive
  const sessionCode = executionContinuationToken.sessionCode
  const worksetCode = executionContinuationToken.worksetCode
  const queueItemCode = executionContinuationToken.queueItemCode
  const remainingSessionCount = executionContinuationToken.remainingSessionCount
  const totalPlannedItems = executionContinuationToken.totalPlannedItems

  const hasSustainedTarget = sessionCode !== null
  const sustainedBlocked = !sustained

  if (!sustained) {
    warnings.push({
      code: "AUTHORING_SUSTAINED_EXECUTION_BLOCKED",
      message: "Scenario draft authoring sustained execution capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasSustainedTarget) {
    warnings.push({
      code: "NO_SUSTAINED_EXECUTION_TARGET",
      message: "No sustained-execution target is available because no execution-continuation session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      sustainedExecutionCapsule: {
        sustained,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasSustainedTarget,
          sustainedBlocked,
        },
      },
    },
    summary: {
      sustained,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
