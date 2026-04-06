import { runScenarioCatalog } from "../scenario-catalog/run-scenario-catalog"
import { buildScenarioFamilySummary } from "./build-scenario-family-summary"
import { buildScenarioFamilyWarning } from "./build-scenario-family-warning"
import { listScenarioFamilies } from "./list-scenario-families"

export function runScenarioFamilySummary() {
  const catalog = runScenarioCatalog()
  const familyList = listScenarioFamilies()

  const families = familyList.data.families.map((family) =>
    buildScenarioFamilySummary({
      family,
      entries: catalog.data.entries,
    }),
  )

  const totalScenarios = families.reduce((acc, item) => acc + item.totalScenarios, 0)
  const readyCount = families.reduce((acc, item) => acc + item.readyCount, 0)
  const partialCount = families.reduce((acc, item) => acc + item.partialCount, 0)
  const blockedCount = families.reduce((acc, item) => acc + item.blockedCount, 0)

  const warnings =
    families.length === 0
      ? [
          buildScenarioFamilyWarning({
            code: "scenario_family_summary_empty",
            message: "Scenario family summary ran with no families",
            severity: "warning",
          }),
        ]
      : [
          buildScenarioFamilyWarning({
            code: "scenario_family_summary_built",
            message: "Scenario family summary built successfully",
            severity: "info",
          }),
        ]

  return {
    data: {
      families,
    },
    summary: {
      totalFamilies: families.length,
      totalScenarios,
      readyCount,
      partialCount,
      blockedCount,
    },
    warnings: [...catalog.warnings, ...familyList.warnings, ...warnings],
  }
}
