import { runNamedScenario } from "../scenarios/run-named-scenario"
import type { InternalScenarioKey } from "../scenarios/types"
import { buildTracePack } from "./build-trace-pack"

export function runScenarioTracePack(params: { key: InternalScenarioKey }) {
  const scenarioRun = runNamedScenario({
    key: params.key,
  })

  const tracePack = buildTracePack({
    scenarioRun,
  })

  return {
    data: {
      scenarioRun,
      tracePack: tracePack.data,
    },
    summary: tracePack.summary,
    warnings: [...scenarioRun.warnings, ...tracePack.warnings],
  }
}
