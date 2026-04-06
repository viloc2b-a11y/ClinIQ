import type { ScenarioDraftAuthoringExecutionHandshakeResult } from "../scenario-draft-authoring-execution-handshake/types"
import type { ScenarioDraftAuthoringExecuteNowResult } from "./types"

export function buildScenarioDraftAuthoringExecuteNow(
  executionHandshakeResult: ScenarioDraftAuthoringExecutionHandshakeResult,
): ScenarioDraftAuthoringExecuteNowResult {
  const warnings: ScenarioDraftAuthoringExecuteNowResult["warnings"] = []

  const executionHandshake = executionHandshakeResult.data.executionHandshake

  const readinessStatus = executionHandshakeResult.summary.readinessStatus
  const kickoffReady = executionHandshakeResult.summary.kickoffReady
  const launchReady = executionHandshakeResult.summary.launchReady
  const startNow = executionHandshakeResult.summary.startNow
  const startReady = executionHandshakeResult.summary.startReady
  const actNow = executionHandshakeResult.summary.actNow
  const confirmed = executionHandshakeResult.summary.confirmed
  const committed = executionHandshakeResult.summary.committed
  const finalGo = executionHandshakeResult.summary.finalGo
  const readyToExecute = executionHandshakeResult.summary.readyToExecute
  const executionApproved = executionHandshakeResult.summary.executionApproved
  const firstSessionCode = executionHandshake.firstSessionCode
  const firstWorksetCode = executionHandshake.firstWorksetCode
  const firstQueueItemCode = executionHandshake.firstQueueItemCode
  const remainingSessionCount = executionHandshake.remainingSessionCount
  const totalPlannedItems = executionHandshake.totalPlannedItems

  const hasExecuteNowTarget = firstSessionCode !== null
  const executeNow = executionApproved && hasExecuteNowTarget
  const executeNowBlocked = !executeNow

  if (!executeNow) {
    warnings.push({
      code: "AUTHORING_EXECUTE_NOW_NOT_READY",
      message: "Scenario draft authoring execute-now card is not ready to proceed.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_EXECUTE_NOW_WITH_WARNINGS",
      message: "Scenario draft authoring execute-now can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasExecuteNowTarget) {
    warnings.push({
      code: "NO_EXECUTE_NOW_TARGET",
      message: "No execute-now target is available because no execution-handshake target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executeNowCard: {
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
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasExecuteNowTarget,
          executeNowBlocked,
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
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
