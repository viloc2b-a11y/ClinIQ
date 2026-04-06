import type { ScenarioDraftAuthoringCommitCardResult } from "../scenario-draft-authoring-commit-card/types"
import type { ScenarioDraftAuthoringFinalGoResult } from "./types"

export function buildScenarioDraftAuthoringFinalGo(
  commitCardResult: ScenarioDraftAuthoringCommitCardResult,
): ScenarioDraftAuthoringFinalGoResult {
  const warnings: ScenarioDraftAuthoringFinalGoResult["warnings"] = []

  const commitCard = commitCardResult.data.commitCard

  const readinessStatus = commitCardResult.summary.readinessStatus
  const kickoffReady = commitCardResult.summary.kickoffReady
  const launchReady = commitCardResult.summary.launchReady
  const startNow = commitCardResult.summary.startNow
  const startReady = commitCardResult.summary.startReady
  const actNow = commitCardResult.summary.actNow
  const confirmed = commitCardResult.summary.confirmed
  const committed = commitCardResult.summary.committed
  const firstSessionCode = commitCard.firstSessionCode
  const firstWorksetCode = commitCard.firstWorksetCode
  const firstQueueItemCode = commitCard.firstQueueItemCode
  const remainingSessionCount = commitCard.remainingSessionCount
  const totalPlannedItems = commitCard.totalPlannedItems

  const hasFinalGoTarget = firstSessionCode !== null
  const finalGo = committed && hasFinalGoTarget
  const finalGoBlocked = !finalGo

  if (!finalGo) {
    warnings.push({
      code: "AUTHORING_FINAL_GO_NOT_READY",
      message: "Scenario draft authoring final-go card is not ready to proceed.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_FINAL_GO_READY_WITH_WARNINGS",
      message: "Scenario draft authoring final-go can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasFinalGoTarget) {
    warnings.push({
      code: "NO_FINAL_GO_TARGET",
      message: "No final-go target is available because no committed target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      finalGoCard: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        startReady,
        actNow,
        confirmed,
        committed,
        finalGo,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasFinalGoTarget,
          finalGoBlocked,
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
      finalGo,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
