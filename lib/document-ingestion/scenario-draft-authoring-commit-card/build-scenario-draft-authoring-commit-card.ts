import type { ScenarioDraftAuthoringActionConfirmationResult } from "../scenario-draft-authoring-action-confirmation/types"
import type { ScenarioDraftAuthoringCommitCardResult } from "./types"

export function buildScenarioDraftAuthoringCommitCard(
  confirmationResult: ScenarioDraftAuthoringActionConfirmationResult,
): ScenarioDraftAuthoringCommitCardResult {
  const warnings: ScenarioDraftAuthoringCommitCardResult["warnings"] = []

  const confirmationSnapshot = confirmationResult.data.confirmationSnapshot

  const readinessStatus = confirmationResult.summary.readinessStatus
  const kickoffReady = confirmationResult.summary.kickoffReady
  const launchReady = confirmationResult.summary.launchReady
  const startNow = confirmationResult.summary.startNow
  const startReady = confirmationResult.summary.startReady
  const actNow = confirmationResult.summary.actNow
  const confirmed = confirmationResult.summary.confirmed
  const firstSessionCode = confirmationSnapshot.firstSessionCode
  const firstWorksetCode = confirmationSnapshot.firstWorksetCode
  const firstQueueItemCode = confirmationSnapshot.firstQueueItemCode
  const remainingSessionCount = confirmationSnapshot.remainingSessionCount
  const totalPlannedItems = confirmationSnapshot.totalPlannedItems

  const hasCommittedTarget = firstSessionCode !== null
  const committed = confirmed && hasCommittedTarget
  const commitBlocked = !committed

  if (!committed) {
    warnings.push({
      code: "AUTHORING_COMMIT_CARD_NOT_READY",
      message: "Scenario draft authoring commit card is not ready to commit execution.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_COMMIT_CARD_READY_WITH_WARNINGS",
      message: "Scenario draft authoring commit can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasCommittedTarget) {
    warnings.push({
      code: "NO_COMMITTED_TARGET",
      message: "No committed target is available because no confirmed action target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      commitCard: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        startReady,
        actNow,
        confirmed,
        committed,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasCommittedTarget,
          commitBlocked,
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
      committed,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
