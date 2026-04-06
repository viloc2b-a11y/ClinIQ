import { buildScenarioFamilyWarning } from "./build-scenario-family-warning"
import { listScenarioFamilies } from "./list-scenario-families"
import type { ScenarioFamilyKey } from "./types"

export function getScenarioFamily(params: { key: ScenarioFamilyKey }) {
  const families = listScenarioFamilies().data.families
  const family = families.find((item) => item.key === params.key) || null

  return {
    data: {
      family,
    },
    summary: {
      found: family != null,
      key: params.key,
    },
    warnings:
      family == null
        ? [
            buildScenarioFamilyWarning({
              code: "scenario_family_not_found",
              message: `No scenario family found for key: ${params.key}`,
              severity: "error",
            }),
          ]
        : ([] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>),
  }
}
