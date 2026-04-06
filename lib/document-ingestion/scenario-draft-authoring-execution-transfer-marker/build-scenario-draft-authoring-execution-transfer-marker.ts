import type { ScenarioDraftAuthoringExecutionHandoffCapsuleResult } from "../scenario-draft-authoring-execution-handoff-capsule/types"
import type { ScenarioDraftAuthoringExecutionTransferMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionTransferMarker(
  executionHandoffCapsuleResult: ScenarioDraftAuthoringExecutionHandoffCapsuleResult,
): ScenarioDraftAuthoringExecutionTransferMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionTransferMarkerResult["warnings"] = []

  const executionHandoffCapsule =
    executionHandoffCapsuleResult.data.executionHandoffCapsule

  const transferActive = executionHandoffCapsule.handoffActive
  const sessionCode = executionHandoffCapsule.sessionCode
  const worksetCode = executionHandoffCapsule.worksetCode
  const queueItemCode = executionHandoffCapsule.queueItemCode
  const remainingSessionCount = executionHandoffCapsule.remainingSessionCount
  const totalPlannedItems = executionHandoffCapsule.totalPlannedItems

  const hasTransferTarget = sessionCode !== null
  const transferBlocked = !transferActive

  if (!transferActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_TRANSFER_BLOCKED",
      message: "Scenario draft authoring execution transfer marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasTransferTarget) {
    warnings.push({
      code: "NO_EXECUTION_TRANSFER_TARGET",
      message: "No execution transfer target is available because no execution-handoff session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionTransferMarker: {
        transferActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasTransferTarget,
          transferBlocked,
        },
      },
    },
    summary: {
      transferActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
