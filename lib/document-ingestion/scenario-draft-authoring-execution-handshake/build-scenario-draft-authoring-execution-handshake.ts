import type { ScenarioDraftAuthoringReadyToExecuteResult } from "../scenario-draft-authoring-ready-to-execute/types"
import type { ScenarioDraftAuthoringExecutionHandshakeResult } from "./types"

export function buildScenarioDraftAuthoringExecutionHandshake(
  readyToExecuteResult: ScenarioDraftAuthoringReadyToExecuteResult,
): ScenarioDraftAuthoringExecutionHandshakeResult {
  const warnings: ScenarioDraftAuthoringExecutionHandshakeResult["warnings"] = []

  const readyToExecuteSnapshot = readyToExecuteResult.data.readyToExecuteSnapshot

  const readinessStatus = readyToExecuteResult.summary.readinessStatus
  const kickoffReady = readyToExecuteResult.summary.kickoffReady
  const launchReady = readyToExecuteResult.summary.launchReady
  const startNow = readyToExecuteResult.summary.startNow
  const startReady = readyToExecuteResult.summary.startReady
  const actNow = readyToExecuteResult.summary.actNow
  const confirmed = readyToExecuteResult.summary.confirmed
  const committed = readyToExecuteResult.summary.committed
  const finalGo = readyToExecuteResult.summary.finalGo
  const readyToExecute = readyToExecuteResult.summary.readyToExecute
  const firstSessionCode = readyToExecuteSnapshot.firstSessionCode
  const firstWorksetCode = readyToExecuteSnapshot.firstWorksetCode
  const firstQueueItemCode = readyToExecuteSnapshot.firstQueueItemCode
  const remainingSessionCount = readyToExecuteSnapshot.remainingSessionCount
  const totalPlannedItems = readyToExecuteSnapshot.totalPlannedItems

  const hasExecutionHandshakeTarget = firstSessionCode !== null
  const executionApproved = readyToExecute && hasExecutionHandshakeTarget
  const executionHandshakeBlocked = !executionApproved

  if (!executionApproved) {
    warnings.push({
      code: "AUTHORING_EXECUTION_HANDSHAKE_NOT_READY",
      message: "Scenario draft authoring execution handshake is not ready to proceed.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_EXECUTION_HANDSHAKE_WITH_WARNINGS",
      message: "Scenario draft authoring execution handshake can proceed but includes warning conditions.",
      severity: "warning",
    })
  }

  if (!hasExecutionHandshakeTarget) {
    warnings.push({
      code: "NO_EXECUTION_HANDSHAKE_TARGET",
      message: "No execution-handshake target is available because no ready-to-execute target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionHandshake: {
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
        firstSessionCode,
        firstWorksetCode,
        firstQueueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasExecutionHandshakeTarget,
          executionHandshakeBlocked,
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
      firstSessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
