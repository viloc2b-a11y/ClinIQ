import type { ScenarioDraftAuthoringExecutionChainMarkerResult } from "../scenario-draft-authoring-execution-chain-marker/types"
import type { ScenarioDraftAuthoringExecutionSequenceCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionSequenceCapsule(
  executionChainMarkerResult: ScenarioDraftAuthoringExecutionChainMarkerResult,
): ScenarioDraftAuthoringExecutionSequenceCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionSequenceCapsuleResult["warnings"] = []

  const executionChainMarker = executionChainMarkerResult.data.executionChainMarker

  const sequenceActive = executionChainMarker.chainActive
  const sessionCode = executionChainMarker.sessionCode
  const worksetCode = executionChainMarker.worksetCode
  const queueItemCode = executionChainMarker.queueItemCode
  const remainingSessionCount = executionChainMarker.remainingSessionCount
  const totalPlannedItems = executionChainMarker.totalPlannedItems

  const hasSequenceTarget = sessionCode !== null
  const sequenceBlocked = !sequenceActive

  if (!sequenceActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_SEQUENCE_BLOCKED",
      message: "Scenario draft authoring execution sequence capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasSequenceTarget) {
    warnings.push({
      code: "NO_EXECUTION_SEQUENCE_TARGET",
      message: "No execution sequence target is available because no execution-chain session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionSequenceCapsule: {
        sequenceActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasSequenceTarget,
          sequenceBlocked,
        },
      },
    },
    summary: {
      sequenceActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
