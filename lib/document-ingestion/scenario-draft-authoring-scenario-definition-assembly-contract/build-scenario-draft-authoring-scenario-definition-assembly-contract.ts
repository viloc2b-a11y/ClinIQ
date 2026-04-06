import type { ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult } from "../scenario-draft-authoring-scenario-definition-shape-output/types"
import type { ScenarioDraftAuthoringScenarioDefinitionAssemblyContractResult } from "./types"

export function buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
  scenarioDefinitionShapeOutputResult: ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult,
): ScenarioDraftAuthoringScenarioDefinitionAssemblyContractResult {
  const warnings: ScenarioDraftAuthoringScenarioDefinitionAssemblyContractResult["warnings"] = []

  const shapeOutput =
    scenarioDefinitionShapeOutputResult.data.scenarioDefinitionShapeOutput

  const assemblyReady = shapeOutput.shapeOutputReady
  const sessionCode = shapeOutput.sessionCode
  const worksetCode = shapeOutput.worksetCode
  const queueItemCode = shapeOutput.queueItemCode
  const remainingSessionCount = shapeOutput.remainingSessionCount
  const totalPlannedItems = shapeOutput.totalPlannedItems

  const assemblyPayload = {
    title: shapeOutput.shapeOutputPayload.title,
    objective: shapeOutput.shapeOutputPayload.objective,
    trigger: shapeOutput.shapeOutputPayload.trigger,
    expectedBehavior: shapeOutput.shapeOutputPayload.expectedBehavior,
    edgeCases: [...shapeOutput.shapeOutputPayload.edgeCases],
    completionNotes: shapeOutput.shapeOutputPayload.completionNotes,
  }

  const hasAssemblyTarget = queueItemCode !== null
  const assemblyBlocked = !assemblyReady
  const assemblyIsEmpty =
    assemblyPayload.title === null &&
    assemblyPayload.objective === null &&
    assemblyPayload.trigger === null &&
    assemblyPayload.expectedBehavior === null &&
    assemblyPayload.edgeCases.length === 0 &&
    assemblyPayload.completionNotes === null

  const assemblyMarkedComplete = shapeOutput.summary.shapeOutputMarkedComplete

  if (!assemblyReady) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_BLOCKED",
      message: "Scenario-definition assembly contract is not ready for downstream assembly.",
      severity: "warning",
    })
  }

  if (!hasAssemblyTarget) {
    warnings.push({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_TARGET",
      message: "No scenario-definition assembly contract target is available because no queue item target exists.",
      severity: "info",
    })
  }

  if (assemblyIsEmpty) {
    warnings.push({
      code: "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_EMPTY",
      message: "Scenario-definition assembly contract is empty and does not yet contain assembly content.",
      severity: "info",
    })
  }

  return {
    data: {
      scenarioDefinitionAssemblyContract: {
        assemblyReady,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        assemblyTarget: {
          sessionCode,
          worksetCode,
          queueItemCode,
        },
        assemblyPayload,
        summary: {
          hasAssemblyTarget,
          assemblyBlocked,
          assemblyIsEmpty,
          assemblyMarkedComplete,
        },
      },
    },
    summary: {
      assemblyReady,
      sessionCode,
      queueItemCode,
      assemblyIsEmpty,
      assemblyMarkedComplete,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
