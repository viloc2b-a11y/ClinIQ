import type { ScenarioDraftAuthoringDraftScaffoldContractResult } from "../scenario-draft-authoring-draft-scaffold-contract/types"
import type { ScenarioDraftAuthoringDraftInputTemplateResult } from "./types"

export function buildScenarioDraftAuthoringDraftInputTemplate(
  draftScaffoldContractResult: ScenarioDraftAuthoringDraftScaffoldContractResult,
): ScenarioDraftAuthoringDraftInputTemplateResult {
  const warnings: ScenarioDraftAuthoringDraftInputTemplateResult["warnings"] = []

  const draftScaffoldContract = draftScaffoldContractResult.data.draftScaffoldContract

  const templateReady = draftScaffoldContract.scaffoldReady
  const sessionCode = draftScaffoldContract.sessionCode
  const worksetCode = draftScaffoldContract.worksetCode
  const queueItemCode = draftScaffoldContract.queueItemCode
  const remainingSessionCount = draftScaffoldContract.remainingSessionCount
  const totalPlannedItems = draftScaffoldContract.totalPlannedItems

  const templateFields = {
    title: draftScaffoldContract.scaffold.title,
    objective: draftScaffoldContract.scaffold.objective,
    trigger: draftScaffoldContract.scaffold.trigger,
    expectedBehavior: draftScaffoldContract.scaffold.expectedBehavior,
    edgeCases: [...draftScaffoldContract.scaffold.edgeCases],
  }

  const hasTemplateTarget = queueItemCode !== null
  const templateBlocked = !templateReady
  const templateIsEmpty =
    templateFields.title === null &&
    templateFields.objective === null &&
    templateFields.trigger === null &&
    templateFields.expectedBehavior === null &&
    templateFields.edgeCases.length === 0

  if (!templateReady) {
    warnings.push({
      code: "AUTHORING_DRAFT_INPUT_TEMPLATE_BLOCKED",
      message: "Scenario draft authoring draft input template is not ready for downstream drafting input use.",
      severity: "warning",
    })
  }

  if (!hasTemplateTarget) {
    warnings.push({
      code: "NO_AUTHORING_DRAFT_INPUT_TEMPLATE_TARGET",
      message: "No authoring draft input template target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (templateIsEmpty) {
    warnings.push({
      code: "AUTHORING_DRAFT_INPUT_TEMPLATE_EMPTY",
      message: "Draft input template is intentionally empty and awaits human authoring input.",
      severity: "info",
    })
  }

  return {
    data: {
      draftInputTemplate: {
        templateReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        templateTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        templateFields,
        summary: {
          hasTemplateTarget,
          templateBlocked,
          templateIsEmpty,
        },
      },
    },
    summary: {
      templateReady,
      sessionCode,
      queueItemCode,
      templateIsEmpty,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
