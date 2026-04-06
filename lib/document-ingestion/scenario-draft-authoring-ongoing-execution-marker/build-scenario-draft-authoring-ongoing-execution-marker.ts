import type { ScenarioDraftAuthoringSustainedExecutionCapsuleResult } from "../scenario-draft-authoring-sustained-execution-capsule/types"
import type { ScenarioDraftAuthoringOngoingExecutionMarkerResult } from "./types"

export function buildScenarioDraftAuthoringOngoingExecutionMarker(
  sustainedExecutionCapsuleResult: ScenarioDraftAuthoringSustainedExecutionCapsuleResult,
): ScenarioDraftAuthoringOngoingExecutionMarkerResult {
  const warnings: ScenarioDraftAuthoringOngoingExecutionMarkerResult["warnings"] = []

  const sustainedExecutionCapsule =
    sustainedExecutionCapsuleResult.data.sustainedExecutionCapsule

  const ongoing = sustainedExecutionCapsule.sustained
  const sessionCode = sustainedExecutionCapsule.sessionCode
  const worksetCode = sustainedExecutionCapsule.worksetCode
  const queueItemCode = sustainedExecutionCapsule.queueItemCode
  const remainingSessionCount = sustainedExecutionCapsule.remainingSessionCount
  const totalPlannedItems = sustainedExecutionCapsule.totalPlannedItems

  const hasOngoingTarget = sessionCode !== null
  const ongoingBlocked = !ongoing

  if (!ongoing) {
    warnings.push({
      code: "AUTHORING_ONGOING_EXECUTION_BLOCKED",
      message: "Scenario draft authoring ongoing execution marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasOngoingTarget) {
    warnings.push({
      code: "NO_ONGOING_EXECUTION_TARGET",
      message: "No ongoing-execution target is available because no sustained-execution session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      ongoingExecutionMarker: {
        ongoing,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasOngoingTarget,
          ongoingBlocked,
        },
      },
    },
    summary: {
      ongoing,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
