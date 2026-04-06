import type { ScenarioDraftAuthoringFinalizedDraftHandoffContractResult } from "../scenario-draft-authoring-finalized-draft-handoff-contract/types"
import type { ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult } from "./types"

export function buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
  finalizedDraftHandoffContractResult: ScenarioDraftAuthoringFinalizedDraftHandoffContractResult,
): ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult {
  const warnings: ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult["warnings"] = []

  const handoffContract =
    finalizedDraftHandoffContractResult.data.finalizedDraftHandoffContract

  const packageReady = handoffContract.handoffReady
  const sessionCode = handoffContract.sessionCode
  const worksetCode = handoffContract.worksetCode
  const queueItemCode = handoffContract.queueItemCode
  const remainingSessionCount = handoffContract.remainingSessionCount
  const totalPlannedItems = handoffContract.totalPlannedItems

  const draftPackagePayload = {
    title: handoffContract.handoffPayload.title,
    objective: handoffContract.handoffPayload.objective,
    trigger: handoffContract.handoffPayload.trigger,
    expectedBehavior: handoffContract.handoffPayload.expectedBehavior,
    edgeCases: [...handoffContract.handoffPayload.edgeCases],
    completionNotes: handoffContract.handoffPayload.completionNotes,
  }

  const hasPackageTarget = queueItemCode !== null
  const packageBlocked = !packageReady
  const packageIsEmpty =
    draftPackagePayload.title === null &&
    draftPackagePayload.objective === null &&
    draftPackagePayload.trigger === null &&
    draftPackagePayload.expectedBehavior === null &&
    draftPackagePayload.edgeCases.length === 0 &&
    draftPackagePayload.completionNotes === null

  const packageMarkedComplete = handoffContract.summary.handoffMarkedComplete

  if (!packageReady) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_BLOCKED",
      message: "Scenario-definition draft package is not ready for downstream structuring.",
      severity: "warning",
    })
  }

  if (!hasPackageTarget) {
    warnings.push({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_TARGET",
      message: "No scenario-definition draft package target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (packageIsEmpty) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_EMPTY",
      message: "Scenario-definition draft package is empty and does not yet contain draft packaging content.",
      severity: "info",
    })
  }

  return {
    data: {
      scenarioDefinitionDraftPackage: {
        packageReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        packageTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        draftPackagePayload,
        summary: {
          hasPackageTarget,
          packageBlocked,
          packageIsEmpty,
          packageMarkedComplete,
        },
      },
    },
    summary: {
      packageReady,
      sessionCode,
      queueItemCode,
      packageIsEmpty,
      packageMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
