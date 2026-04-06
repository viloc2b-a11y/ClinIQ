import type { ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult } from "../scenario-draft-authoring-scenario-definition-structuring-contract/types"
import type { ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult } from "./types"

export function buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
  scenarioDefinitionStructuringContractResult: ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult,
): ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult {
  const warnings: ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult["warnings"] = []

  const structuringContract =
    scenarioDefinitionStructuringContractResult.data.scenarioDefinitionStructuringContract

  const shapeReady = structuringContract.structuringReady
  const sessionCode = structuringContract.sessionCode
  const worksetCode = structuringContract.worksetCode
  const queueItemCode = structuringContract.queueItemCode
  const remainingSessionCount = structuringContract.remainingSessionCount
  const totalPlannedItems = structuringContract.totalPlannedItems

  const shapePayload = {
    title: structuringContract.structuringPayload.title,
    objective: structuringContract.structuringPayload.objective,
    trigger: structuringContract.structuringPayload.trigger,
    expectedBehavior: structuringContract.structuringPayload.expectedBehavior,
    edgeCases: [...structuringContract.structuringPayload.edgeCases],
    completionNotes: structuringContract.structuringPayload.completionNotes,
  }

  const hasShapeTarget = queueItemCode !== null
  const shapeBlocked = !shapeReady
  const shapeIsEmpty =
    shapePayload.title === null &&
    shapePayload.objective === null &&
    shapePayload.trigger === null &&
    shapePayload.expectedBehavior === null &&
    shapePayload.edgeCases.length === 0 &&
    shapePayload.completionNotes === null

  const shapeMarkedComplete = structuringContract.summary.structuringMarkedComplete

  if (!shapeReady) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_BLOCKED",
      message: "Scenario-definition shape template is not ready for downstream shaping.",
      severity: "warning",
    })
  }

  if (!hasShapeTarget) {
    warnings.push({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_TARGET",
      message: "No scenario-definition shape template target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (shapeIsEmpty) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_EMPTY",
      message: "Scenario-definition shape template is empty and does not yet contain shape content.",
      severity: "info",
    })
  }

  return {
    data: {
      scenarioDefinitionShapeTemplate: {
        shapeReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        shapeTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        shapePayload,
        summary: {
          hasShapeTarget,
          shapeBlocked,
          shapeIsEmpty,
          shapeMarkedComplete,
        },
      },
    },
    summary: {
      shapeReady,
      sessionCode,
      queueItemCode,
      shapeIsEmpty,
      shapeMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
