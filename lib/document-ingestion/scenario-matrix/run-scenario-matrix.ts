import { listInternalScenarios } from "../scenarios/list-internal-scenarios"
import { runNamedScenario } from "../scenarios/run-named-scenario"
import { buildScenarioMatrixSummary } from "./build-scenario-matrix-summary"
import { buildScenarioMatrixWarning } from "./build-scenario-matrix-warning"
import { toScenarioMatrixRow } from "./to-scenario-matrix-row"

export function runScenarioMatrix() {
  const scenarioList = listInternalScenarios()
  const scenarios = scenarioList.data.scenarios

  const rows = scenarios.map((scenario) => {
    const runResult = runNamedScenario({
      key: scenario.key,
    })

    return toScenarioMatrixRow({
      scenario,
      runResult,
    })
  })

  const summary = buildScenarioMatrixSummary({
    rows,
  })

  const warnings =
    rows.length === 0
      ? [
          buildScenarioMatrixWarning({
            code: "scenario_matrix_empty",
            message: "Scenario matrix ran with no scenarios",
            severity: "warning",
          }),
        ]
      : [
          buildScenarioMatrixWarning({
            code: "scenario_matrix_built",
            message: "Scenario matrix built successfully",
            severity: "info",
          }),
        ]

  return {
    data: {
      rows,
    },
    summary: {
      totalScenarios: summary.summary.totalScenarios,
      readyCount: summary.summary.readyCount,
      partialCount: summary.summary.partialCount,
      blockedCount: summary.summary.blockedCount,
      outputsReadyCount: summary.summary.outputsReadyCount,
    },
    warnings: [...scenarioList.warnings, ...summary.warnings, ...warnings],
  }
}
