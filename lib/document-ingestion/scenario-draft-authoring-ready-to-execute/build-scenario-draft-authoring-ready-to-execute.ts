import type { ScenarioDraftAuthoringFinalGoResult } from "../scenario-draft-authoring-final-go/types"
import type { ScenarioDraftAuthoringReadyToExecuteResult } from "./types"

export function buildScenarioDraftAuthoringReadyToExecute(
  finalGoResult: ScenarioDraftAuthoringFinalGoResult,
): ScenarioDraftAuthoringReadyToExecuteResult {
  const warnings: ScenarioDraftAuthoringReadyToExecuteResult["warnings"] = []

  const finalGoCard = finalGoResult.data.finalGoCard

  const readinessStatus = finalGoResult.summary.readinessStatus
  const kickoffReady = finalGoResult.summary.kickoffReady
  const launchReady = finalGoResult.summary.launchReady
  const startNow = finalGoResult.summary.startNow
  const startReady = finalGoResult.summary.startReady
  const actNow = finalGoResult.summary.actNow
  const confirmed = finalGoResult.summary.confirmed
  const committed = finalGoResult.summary.committed
  const finalGo = finalGoResult.summary.finalGo
  const firstSessionCode = finalGoCard.firstSessionCode
  const firstWorksetCode = finalGoCard.firstWorksetCode
  const firstQueueItemCode = finalGoCard.firstQueueItemCode
  const remainingSessionCount = finalGoCard.remainingSessionCount
  const totalPlannedItems = finalGoCard.totalPlannedItems

  const hasReadyToExecuteTarget = firstSessionCode !== null
  const readyToExecute = finalGo && hasReadyToExecuteTarget
  const readyToExecuteBlocked = !readyToExecute

  if (!readyToExecute) {
    warnings.push({
      code: "AUTHORING_READY_TO_EXECUTE_NOT_READY",
      message: "Scenario draft authoring ready-to-execute snapshot is not ready to proceed.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_READY_TO_EXECUTE_WITH_WARNINGS",
      message: "Scenario draft authoring is ready to execute but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasReadyToExecuteTarget) {
    warnings.push({
      code: "NO_READY_TO_EXECUTE_TARGET",
      message: "No ready-to-execute target is available because no final-go target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      readyToExecuteSnapshot: {
        readinessStatus,
        kickoffReady,
        launchReady,
        startNow,
        startReady,
        actNow,
        confirmed,
        committed,
        finalGo,
        readyToExecute,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasReadyToExecuteTarget,
          readyToExecuteBlocked,
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
      readyToExecute,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
