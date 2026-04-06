import type { ScenarioDraftAuthoringImmediateExecutionTokenResult } from "../scenario-draft-authoring-immediate-execution-token/types"
import type { ScenarioDraftAuthoringActiveExecutionEnvelopeResult } from "./types"

export function buildScenarioDraftAuthoringActiveExecutionEnvelope(
  immediateExecutionTokenResult: ScenarioDraftAuthoringImmediateExecutionTokenResult,
): ScenarioDraftAuthoringActiveExecutionEnvelopeResult {
  const warnings: ScenarioDraftAuthoringActiveExecutionEnvelopeResult["warnings"] = []

  const executionToken = immediateExecutionTokenResult.data.executionToken

  const active = executionToken.executionAllowed
  const sessionCode = executionToken.sessionCode
  const worksetCode = executionToken.worksetCode
  const queueItemCode = executionToken.queueItemCode
  const remainingSessionCount = executionToken.remainingSessionCount
  const totalPlannedItems = executionToken.totalPlannedItems

  const hasActiveTarget = sessionCode !== null
  const activeBlocked = !active

  if (!active) {
    warnings.push({
      code: "AUTHORING_ACTIVE_EXECUTION_BLOCKED",
      message: "Scenario draft authoring active execution envelope is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasActiveTarget) {
    warnings.push({
      code: "NO_ACTIVE_EXECUTION_TARGET",
      message: "No active execution target is available because no immediate execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      activeExecutionEnvelope: {
        active,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasActiveTarget,
          activeBlocked,
        },
      },
    },
    summary: {
      active,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
