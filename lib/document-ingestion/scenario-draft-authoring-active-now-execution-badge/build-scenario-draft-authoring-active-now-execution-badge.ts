import type { ScenarioDraftAuthoringCurrentExecutionStampResult } from "../scenario-draft-authoring-current-execution-stamp/types"
import type { ScenarioDraftAuthoringActiveNowExecutionBadgeResult } from "./types"

export function buildScenarioDraftAuthoringActiveNowExecutionBadge(
  currentExecutionStampResult: ScenarioDraftAuthoringCurrentExecutionStampResult,
): ScenarioDraftAuthoringActiveNowExecutionBadgeResult {
  const warnings: ScenarioDraftAuthoringActiveNowExecutionBadgeResult["warnings"] = []

  const currentExecutionStamp = currentExecutionStampResult.data.currentExecutionStamp

  const activeNow = currentExecutionStamp.current
  const sessionCode = currentExecutionStamp.sessionCode
  const worksetCode = currentExecutionStamp.worksetCode
  const queueItemCode = currentExecutionStamp.queueItemCode
  const remainingSessionCount = currentExecutionStamp.remainingSessionCount
  const totalPlannedItems = currentExecutionStamp.totalPlannedItems

  const hasActiveNowTarget = sessionCode !== null
  const activeNowBlocked = !activeNow

  if (!activeNow) {
    warnings.push({
      code: "AUTHORING_ACTIVE_NOW_EXECUTION_BLOCKED",
      message: "Scenario draft authoring active-now execution badge is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasActiveNowTarget) {
    warnings.push({
      code: "NO_ACTIVE_NOW_EXECUTION_TARGET",
      message: "No active-now execution target is available because no current execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      activeNowExecutionBadge: {
        activeNow,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasActiveNowTarget,
          activeNowBlocked,
        },
      },
    },
    summary: {
      activeNow,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
