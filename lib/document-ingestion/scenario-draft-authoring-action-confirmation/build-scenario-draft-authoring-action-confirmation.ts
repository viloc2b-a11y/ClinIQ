import type { ScenarioDraftAuthoringImmediateActionResult } from "../scenario-draft-authoring-immediate-action/types"
import type { ScenarioDraftAuthoringActionConfirmationResult } from "./types"

export function buildScenarioDraftAuthoringActionConfirmation(
  immediateActionResult: ScenarioDraftAuthoringImmediateActionResult,
): ScenarioDraftAuthoringActionConfirmationResult {
  const warnings: ScenarioDraftAuthoringActionConfirmationResult["warnings"] = []

  const immediateActionCard = immediateActionResult.data.immediateActionCard

  const readinessStatus = immediateActionResult.summary.readinessStatus
  const kickoffReady = immediateActionResult.summary.kickoffReady
  const launchReady = immediateActionResult.summary.launchReady
  const startNow = immediateActionResult.summary.startNow
  const startReady = immediateActionResult.summary.startReady
  const actNow = immediateActionResult.summary.actNow
  const firstSessionCode = immediateActionCard.firstSessionCode
  const firstWorksetCode = immediateActionCard.firstWorksetCode
  const firstQueueItemCode = immediateActionCard.firstQueueItemCode
  const remainingSessionCount = immediateActionCard.remainingSessionCount
  const totalPlannedItems = immediateActionCard.totalPlannedItems

  const hasConfirmedActionTarget = firstSessionCode !== null
  const confirmed = actNow && hasConfirmedActionTarget
  const confirmationBlocked = !confirmed

  if (!confirmed) {
    warnings.push({
      code: "AUTHORING_ACTION_CONFIRMATION_NOT_READY",
      message: "Scenario draft authoring confirmation snapshot is not ready to confirm execution.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_ACTION_CONFIRMATION_READY_WITH_WARNINGS",
      message: "Scenario draft authoring confirmation can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasConfirmedActionTarget) {
    warnings.push({
      code: "NO_CONFIRMED_ACTION_TARGET",
      message: "No confirmed action target is available because no immediate action target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      confirmationSnapshot: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        startReady,
        actNow,
        confirmed,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasConfirmedActionTarget,
          confirmationBlocked,
          totalSessions: remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      launchReady,
      startNow,
      startReady,
      actNow,
      confirmed,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
