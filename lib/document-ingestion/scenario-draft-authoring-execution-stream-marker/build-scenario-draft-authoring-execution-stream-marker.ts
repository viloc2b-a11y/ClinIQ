import type { ScenarioDraftAuthoringExecutionSequenceCapsuleResult } from "../scenario-draft-authoring-execution-sequence-capsule/types"
import type { ScenarioDraftAuthoringExecutionStreamMarkerResult } from "./types"

export function buildScenarioDraftAuthoringExecutionStreamMarker(
  executionSequenceCapsuleResult: ScenarioDraftAuthoringExecutionSequenceCapsuleResult,
): ScenarioDraftAuthoringExecutionStreamMarkerResult {
  const warnings: ScenarioDraftAuthoringExecutionStreamMarkerResult["warnings"] = []

  const executionSequenceCapsule =
    executionSequenceCapsuleResult.data.executionSequenceCapsule

  const streamActive = executionSequenceCapsule.sequenceActive
  const sessionCode = executionSequenceCapsule.sessionCode
  const worksetCode = executionSequenceCapsule.worksetCode
  const queueItemCode = executionSequenceCapsule.queueItemCode
  const remainingSessionCount = executionSequenceCapsule.remainingSessionCount
  const totalPlannedItems = executionSequenceCapsule.totalPlannedItems

  const hasStreamTarget = sessionCode !== null
  const streamBlocked = !streamActive

  if (!streamActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_STREAM_BLOCKED",
      message: "Scenario draft authoring execution stream marker is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasStreamTarget) {
    warnings.push({
      code: "NO_EXECUTION_STREAM_TARGET",
      message: "No execution stream target is available because no execution-sequence session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionStreamMarker: {
        streamActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasStreamTarget,
          streamBlocked,
        },
      },
    },
    summary: {
      streamActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
