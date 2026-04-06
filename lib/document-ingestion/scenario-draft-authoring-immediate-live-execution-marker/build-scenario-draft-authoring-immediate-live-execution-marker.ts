import type { ScenarioDraftAuthoringActiveNowExecutionBadgeResult } from "../scenario-draft-authoring-active-now-execution-badge/types"
import type { ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult } from "./types"

export function buildScenarioDraftAuthoringImmediateLiveExecutionMarker(
  activeNowExecutionBadgeResult: ScenarioDraftAuthoringActiveNowExecutionBadgeResult,
): ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult {
  const warnings: ScenarioDraftAuthoringImmediateLiveExecutionMarkerResult["warnings"] = []

  const activeNowExecutionBadge = activeNowExecutionBadgeResult.data.activeNowExecutionBadge

  const immediateLive = activeNowExecutionBadge.activeNow
  const sessionCode = activeNowExecutionBadge.sessionCode
  const worksetCode = activeNowExecutionBadge.worksetCode
  const queueItemCode = activeNowExecutionBadge.queueItemCode
  const remainingSessionCount = activeNowExecutionBadge.remainingSessionCount
  const totalPlannedItems = activeNowExecutionBadge.totalPlannedItems

  const hasImmediateLiveTarget = sessionCode !== null
  const immediateLiveBlocked = !immediateLive

  if (!immediateLive) {
    warnings.push({
      code: "AUTHORING_IMMEDIATE_LIVE_EXECUTION_BLOCKED",
      message: "Scenario draft authoring immediate-live execution marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasImmediateLiveTarget) {
    warnings.push({
      code: "NO_IMMEDIATE_LIVE_EXECUTION_TARGET",
      message: "No immediate-live execution target is available because no active-now execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      immediateLiveExecutionMarker: {
        immediateLive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasImmediateLiveTarget,
          immediateLiveBlocked,
        },
      },
    },
    summary: {
      immediateLive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
