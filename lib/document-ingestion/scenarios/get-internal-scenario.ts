import { buildScenarioWarning } from "./build-scenario-warning"
import { listInternalScenarios } from "./list-internal-scenarios"
import type { InternalScenarioKey } from "./types"

export function getInternalScenario(params: { key: InternalScenarioKey }) {
  const scenarios = listInternalScenarios().data.scenarios
  const scenario = scenarios.find((item) => item.key === params.key) || null

  return {
    data: {
      scenario,
    },
    summary: {
      found: scenario != null,
      key: params.key,
    },
    warnings:
      scenario == null
        ? [
            buildScenarioWarning({
              code: "internal_scenario_not_found",
              message: `No internal scenario found for key: ${params.key}`,
              severity: "error",
            }),
          ]
        : ([] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>),
  }
}
