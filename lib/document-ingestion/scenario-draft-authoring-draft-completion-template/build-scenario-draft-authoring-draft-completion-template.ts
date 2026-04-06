import type { ScenarioDraftAuthoringDraftInputTemplateResult } from "../scenario-draft-authoring-draft-input-template/types"
import type { ScenarioDraftAuthoringDraftCompletionTemplateResult } from "./types"

export function buildScenarioDraftAuthoringDraftCompletionTemplate(
  draftInputTemplateResult: ScenarioDraftAuthoringDraftInputTemplateResult,
): ScenarioDraftAuthoringDraftCompletionTemplateResult {
  const warnings: ScenarioDraftAuthoringDraftCompletionTemplateResult["warnings"] = []

  const template = draftInputTemplateResult.data.draftInputTemplate

  const completionReady = template.templateReady
  const sessionCode = template.sessionCode
  const worksetCode = template.worksetCode
  const queueItemCode = template.queueItemCode
  const remainingSessionCount = template.remainingSessionCount
  const totalPlannedItems = template.totalPlannedItems

  const completionFields = {
    title: template.templateFields.title,
    objective: template.templateFields.objective,
    trigger: template.templateFields.trigger,
    expectedBehavior: template.templateFields.expectedBehavior,
    edgeCases: [...template.templateFields.edgeCases],
    completionNotes: null,
    isFinalized: false,
  }

  const hasCompletionTarget = queueItemCode !== null
  const completionBlocked = !completionReady
  const completionIsEmpty =
    completionFields.title === null &&
    completionFields.objective === null &&
    completionFields.trigger === null &&
    completionFields.expectedBehavior === null &&
    completionFields.edgeCases.length === 0 &&
    completionFields.completionNotes === null

  const completionIsFinalized = completionFields.isFinalized === true

  if (!completionReady) {
    warnings.push({
      code: "AUTHORING_DRAFT_COMPLETION_TEMPLATE_BLOCKED",
      message: "Scenario draft completion template is not ready for finalization.",
      severity: "warning",
    })
  }

  if (!hasCompletionTarget) {
    warnings.push({
      code: "NO_AUTHORING_DRAFT_COMPLETION_TEMPLATE_TARGET",
      message: "No completion template target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (completionIsEmpty) {
    warnings.push({
      code: "AUTHORING_DRAFT_COMPLETION_TEMPLATE_EMPTY",
      message: "Completion template is empty and awaits human finalization.",
      severity: "info",
    })
  }

  return {
    data: {
      draftCompletionTemplate: {
        completionReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        completionTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        completionFields,
        summary: {
          hasCompletionTarget,
          completionBlocked,
          completionIsEmpty,
          completionIsFinalized,
        },
      },
    },
    summary: {
      completionReady,
      sessionCode,
      queueItemCode,
      completionIsEmpty,
      completionIsFinalized,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
