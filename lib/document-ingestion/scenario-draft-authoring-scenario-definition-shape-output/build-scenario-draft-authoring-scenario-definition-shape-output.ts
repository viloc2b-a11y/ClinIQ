import type { ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult } from "../scenario-draft-authoring-scenario-definition-shape-template/types"
import type { ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult } from "./types"

export function buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
  scenarioDefinitionShapeTemplateResult: ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult,
): ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult {
  const warnings: ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult["warnings"] = []

  const shapeTemplate =
    scenarioDefinitionShapeTemplateResult.data.scenarioDefinitionShapeTemplate

  const shapeOutputReady = shapeTemplate.shapeReady
  const sessionCode = shapeTemplate.sessionCode
  const worksetCode = shapeTemplate.worksetCode
  const queueItemCode = shapeTemplate.queueItemCode
  const remainingSessionCount = shapeTemplate.remainingSessionCount
  const totalPlannedItems = shapeTemplate.totalPlannedItems

  const shapeOutputPayload = {
    title: shapeTemplate.shapePayload.title,
    objective: shapeTemplate.shapePayload.objective,
    trigger: shapeTemplate.shapePayload.trigger,
    expectedBehavior: shapeTemplate.shapePayload.expectedBehavior,
    edgeCases: [...shapeTemplate.shapePayload.edgeCases],
    completionNotes: shapeTemplate.shapePayload.completionNotes,
  }

  const hasShapeOutputTarget = queueItemCode !== null
  const shapeOutputBlocked = !shapeOutputReady
  const shapeOutputIsEmpty =
    shapeOutputPayload.title === null &&
    shapeOutputPayload.objective === null &&
    shapeOutputPayload.trigger === null &&
    shapeOutputPayload.expectedBehavior === null &&
    shapeOutputPayload.edgeCases.length === 0 &&
    shapeOutputPayload.completionNotes === null

  const shapeOutputMarkedComplete = shapeTemplate.summary.shapeMarkedComplete

  if (!shapeOutputReady) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_BLOCKED",
      message: "Scenario-definition shape output is not ready for downstream conversion.",
      severity: "warning",
    })
  }

  if (!hasShapeOutputTarget) {
    warnings.push({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_TARGET",
      message: "No scenario-definition shape output target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (shapeOutputIsEmpty) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_EMPTY",
      message: "Scenario-definition shape output is empty and does not yet contain shape output content.",
      severity: "info",
    })
  }

  return {
    data: {
      scenarioDefinitionShapeOutput: {
        shapeOutputReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        shapeOutputTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        shapeOutputPayload,
        summary: {
          hasShapeOutputTarget,
          shapeOutputBlocked,
          shapeOutputIsEmpty,
          shapeOutputMarkedComplete,
        },
      },
    },
    summary: {
      shapeOutputReady,
      sessionCode,
      queueItemCode,
      shapeOutputIsEmpty,
      shapeOutputMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
