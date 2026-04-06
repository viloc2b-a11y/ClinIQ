import type { ScenarioDraftAuthoringExecutionTransferMarkerResult } from "../scenario-draft-authoring-execution-transfer-marker/types"
import type { ScenarioDraftAuthoringExecutionSuccessorTokenResult } from "./types"

export function buildScenarioDraftAuthoringExecutionSuccessorToken(
  executionTransferMarkerResult: ScenarioDraftAuthoringExecutionTransferMarkerResult,
): ScenarioDraftAuthoringExecutionSuccessorTokenResult {
  const warnings: ScenarioDraftAuthoringExecutionSuccessorTokenResult["warnings"] = []

  const executionTransferMarker =
    executionTransferMarkerResult.data.executionTransferMarker

  const successorActive = executionTransferMarker.transferActive
  const sessionCode = executionTransferMarker.sessionCode
  const worksetCode = executionTransferMarker.worksetCode
  const queueItemCode = executionTransferMarker.queueItemCode
  const remainingSessionCount = executionTransferMarker.remainingSessionCount
  const totalPlannedItems = executionTransferMarker.totalPlannedItems

  const hasSuccessorTarget = sessionCode !== null
  const successorBlocked = !successorActive

  if (!successorActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_SUCCESSOR_BLOCKED",
      message: "Scenario draft authoring execution successor token is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasSuccessorTarget) {
    warnings.push({
      code: "NO_EXECUTION_SUCCESSOR_TARGET",
      message: "No execution successor target is available because no execution-transfer session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionSuccessorToken: {
        successorActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasSuccessorTarget,
          successorBlocked,
        },
      },
    },
    summary: {
      successorActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
