import type { ScenarioDraftAuthoringDraftCompletionTemplateResult } from "../scenario-draft-authoring-draft-completion-template/types"
import type { ScenarioDraftAuthoringFinalizedDraftOutputResult } from "./types"

export function buildScenarioDraftAuthoringFinalizedDraftOutput(
  draftCompletionTemplateResult: ScenarioDraftAuthoringDraftCompletionTemplateResult,
): ScenarioDraftAuthoringFinalizedDraftOutputResult {
  const warnings: ScenarioDraftAuthoringFinalizedDraftOutputResult["warnings"] = []

  const completionTemplate = draftCompletionTemplateResult.data.draftCompletionTemplate

  const finalizedReady =
    completionTemplate.completionReady &&
    completionTemplate.completionFields.isFinalized === true

  const sessionCode = completionTemplate.sessionCode
  const worksetCode = completionTemplate.worksetCode
  const queueItemCode = completionTemplate.queueItemCode
  const remainingSessionCount = completionTemplate.remainingSessionCount
  const totalPlannedItems = completionTemplate.totalPlannedItems

  const finalizedFields = {
    title: completionTemplate.completionFields.title,
    objective: completionTemplate.completionFields.objective,
    trigger: completionTemplate.completionFields.trigger,
    expectedBehavior: completionTemplate.completionFields.expectedBehavior,
    edgeCases: [...completionTemplate.completionFields.edgeCases],
    completionNotes: completionTemplate.completionFields.completionNotes,
  }

  const hasFinalizedTarget = queueItemCode !== null
  const finalizedBlocked = !finalizedReady
  const finalizedIsEmpty =
    finalizedFields.title === null &&
    finalizedFields.objective === null &&
    finalizedFields.trigger === null &&
    finalizedFields.expectedBehavior === null &&
    finalizedFields.edgeCases.length === 0 &&
    finalizedFields.completionNotes === null

  const finalizedMarkedComplete =
    completionTemplate.completionFields.isFinalized === true

  if (!finalizedReady) {
    warnings.push({
      code: "AUTHORING_FINALIZED_DRAFT_OUTPUT_BLOCKED",
      message: "Scenario draft finalized output is not ready for downstream handoff.",
      severity: "warning",
    })
  }

  if (!hasFinalizedTarget) {
    warnings.push({
      code: "NO_AUTHORING_FINALIZED_DRAFT_OUTPUT_TARGET",
      message: "No finalized draft output target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (finalizedIsEmpty) {
    warnings.push({
      code: "AUTHORING_FINALIZED_DRAFT_OUTPUT_EMPTY",
      message: "Finalized draft output is empty and does not yet contain human-authored draft content.",
      severity: "info",
    })
  }

  return {
    data: {
      finalizedDraftOutput: {
        finalizedReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        finalizedTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        finalizedFields,
        summary: {
          hasFinalizedTarget,
          finalizedBlocked,
          finalizedIsEmpty,
          finalizedMarkedComplete,
        },
      },
    },
    summary: {
      finalizedReady,
      sessionCode,
      queueItemCode,
      finalizedIsEmpty,
      finalizedMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
