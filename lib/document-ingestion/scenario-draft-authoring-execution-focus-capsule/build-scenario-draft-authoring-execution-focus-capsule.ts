import type { ScenarioDraftAuthoringActiveExecutionEnvelopeResult } from "../scenario-draft-authoring-active-execution-envelope/types"
import type { ScenarioDraftAuthoringExecutionFocusCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionFocusCapsule(
  activeExecutionEnvelopeResult: ScenarioDraftAuthoringActiveExecutionEnvelopeResult,
): ScenarioDraftAuthoringExecutionFocusCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionFocusCapsuleResult["warnings"] = []

  const activeExecutionEnvelope = activeExecutionEnvelopeResult.data.activeExecutionEnvelope

  const focused = activeExecutionEnvelope.active
  const sessionCode = activeExecutionEnvelope.sessionCode
  const worksetCode = activeExecutionEnvelope.worksetCode
  const queueItemCode = activeExecutionEnvelope.queueItemCode
  const remainingSessionCount = activeExecutionEnvelope.remainingSessionCount
  const totalPlannedItems = activeExecutionEnvelope.totalPlannedItems

  const hasFocusTarget = sessionCode !== null
  const focusBlocked = !focused

  if (!focused) {
    warnings.push({
      code: "AUTHORING_EXECUTION_FOCUS_BLOCKED",
      message: "Scenario draft authoring execution focus capsule is not focused and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasFocusTarget) {
    warnings.push({
      code: "NO_EXECUTION_FOCUS_TARGET",
      message: "No execution focus target is available because no active execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionFocusCapsule: {
        focused,
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
      focused,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
