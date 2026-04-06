import { listInternalScenarios } from "../scenarios/list-internal-scenarios"
import { runNamedScenario } from "../scenarios/run-named-scenario"
import { buildScenarioCatalogSummary } from "./build-scenario-catalog-summary"
import { buildScenarioCatalogWarning } from "./build-scenario-catalog-warning"
import { toScenarioCatalogEntry } from "./to-scenario-catalog-entry"

export function runScenarioCatalog() {
  const scenarioList = listInternalScenarios()
  const scenarios = scenarioList.data.scenarios

  const entries = scenarios.map((scenario) => {
    const runResult = runNamedScenario({
      key: scenario.key,
    })

    return toScenarioCatalogEntry({
      scenario,
      runResult,
    })
  })

  const summary = buildScenarioCatalogSummary({
    entries,
  })

  const warnings =
    entries.length === 0
      ? [
          buildScenarioCatalogWarning({
            code: "scenario_catalog_empty",
            message: "Scenario catalog ran with no entries",
            severity: "warning",
          }),
        ]
      : [
          buildScenarioCatalogWarning({
            code: "scenario_catalog_built",
            message: "Scenario catalog built successfully",
            severity: "info",
          }),
        ]

  return {
    data: {
      entries,
    },
    summary: {
      totalEntries: summary.summary.totalEntries,
      readyCount: summary.summary.readyCount,
      partialCount: summary.summary.partialCount,
      blockedCount: summary.summary.blockedCount,
      outputsReadyCount: summary.summary.outputsReadyCount,
    },
    warnings: [...scenarioList.warnings, ...summary.warnings, ...warnings],
  }
}
