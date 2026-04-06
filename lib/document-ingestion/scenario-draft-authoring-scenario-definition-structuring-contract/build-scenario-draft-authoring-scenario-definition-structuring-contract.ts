import type { ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult } from "../scenario-draft-authoring-scenario-definition-draft-package/types"
import type { ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult } from "./types"

export function buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
  scenarioDefinitionDraftPackageResult: ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult,
): ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult {
  const warnings: ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult["warnings"] =
    []

  const draftPackage =
    scenarioDefinitionDraftPackageResult.data.scenarioDefinitionDraftPackage

  const structuringReady = draftPackage.packageReady
  const sessionCode = draftPackage.sessionCode
  const worksetCode = draftPackage.worksetCode
  const queueItemCode = draftPackage.queueItemCode
  const remainingSessionCount = draftPackage.remainingSessionCount
  const totalPlannedItems = draftPackage.totalPlannedItems

  const structuringPayload = {
    title: draftPackage.draftPackagePayload.title,
    objective: draftPackage.draftPackagePayload.objective,
    trigger: draftPackage.draftPackagePayload.trigger,
    expectedBehavior: draftPackage.draftPackagePayload.expectedBehavior,
    edgeCases: [...draftPackage.draftPackagePayload.edgeCases],
    completionNotes: draftPackage.draftPackagePayload.completionNotes,
  }

  const hasStructuringTarget = queueItemCode !== null
  const structuringBlocked = !structuringReady
  const structuringIsEmpty =
    structuringPayload.title === null &&
    structuringPayload.objective === null &&
    structuringPayload.trigger === null &&
    structuringPayload.expectedBehavior === null &&
    structuringPayload.edgeCases.length === 0 &&
    structuringPayload.completionNotes === null

  const structuringMarkedComplete = draftPackage.summary.packageMarkedComplete

  if (!structuringReady) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_BLOCKED",
      message: "Scenario-definition structuring contract is not ready for downstream shaping.",
      severity: "warning",
    })
  }

  if (!hasStructuringTarget) {
    warnings.push({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_TARGET",
      message: "No scenario-definition structuring contract target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (structuringIsEmpty) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_EMPTY",
      message: "Scenario-definition structuring contract is empty and does not yet contain structuring content.",
      severity: "info",
    })
  }

  return {
    data: {
      scenarioDefinitionStructuringContract: {
        structuringReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        structuringTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        structuringPayload,
        summary: {
          hasStructuringTarget,
          structuringBlocked,
          structuringIsEmpty,
          structuringMarkedComplete,
        },
      },
    },
    summary: {
      structuringReady,
      sessionCode,
      queueItemCode,
      structuringIsEmpty,
      structuringMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
