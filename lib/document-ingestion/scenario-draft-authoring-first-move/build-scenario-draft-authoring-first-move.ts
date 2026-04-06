import type { ScenarioDraftAuthoringExecuteNowResult } from "../scenario-draft-authoring-execute-now/types"
import type { ScenarioDraftAuthoringFirstMoveResult } from "./types"

export function buildScenarioDraftAuthoringFirstMove(
  executeNowResult: ScenarioDraftAuthoringExecuteNowResult,
): ScenarioDraftAuthoringFirstMoveResult {
  const warnings: ScenarioDraftAuthoringFirstMoveResult["warnings"] = []

  const executeNowCard = executeNowResult.data.executeNowCard

  const readinessStatus = executeNowResult.summary.readinessStatus
  const kickoffReady = executeNowResult.summary.kickoffReady
  const launchReady = executeNowResult.summary.launchReady
  const startNow = executeNowResult.summary.startNow
  const startReady = executeNowResult.summary.startReady
  const actNow = executeNowResult.summary.actNow
  const confirmed = executeNowResult.summary.confirmed
  const committed = executeNowResult.summary.committed
  const finalGo = executeNowResult.summary.finalGo
  const readyToExecute = executeNowResult.summary.readyToExecute
  const executionApproved = executeNowResult.summary.executionApproved
  const executeNow = executeNowResult.summary.executeNow
  const firstSessionCode = executeNowCard.firstSessionCode
  const firstWorksetCode = executeNowCard.firstWorksetCode
  const firstQueueItemCode = executeNowCard.firstQueueItemCode
  const remainingSessionCount = executeNowCard.remainingSessionCount
  const totalPlannedItems = executeNowCard.totalPlannedItems

  const hasFirstMoveTarget = firstSessionCode !== null
  const firstMoveReady = executeNow && hasFirstMoveTarget
  const firstMoveBlocked = !firstMoveReady

  if (!firstMoveReady) {
    warnings.push({
      code: "AUTHORING_FIRST_MOVE_NOT_READY",
      message: "Scenario draft authoring first-move snapshot is not ready to proceed.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_FIRST_MOVE_WITH_WARNINGS",
      message: "Scenario draft authoring first move can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasFirstMoveTarget) {
    warnings.push({
      code: "NO_FIRST_MOVE_TARGET",
      message: "No first-move target is available because no execute-now target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      firstMoveSnapshot: {
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
        executionApproved,
        executeNow,
        firstMoveReady,
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasFirstMoveTarget,
          firstMoveBlocked,
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
      executionApproved,
      executeNow,
      firstMoveReady,
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
