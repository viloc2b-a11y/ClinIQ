import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioFamilyDefinition, ScenarioFamilyRunSummary } from "./types"

export function buildScenarioFamilySummary(params: {
  family: ScenarioFamilyDefinition
  entries: ScenarioCatalogEntry[]
}): ScenarioFamilyRunSummary {
  const familyEntries = params.entries.filter((entry) =>
    params.family.scenarioKeys.includes(entry.key),
  )

  const readyCount = familyEntries.filter((entry) => entry.status === "ready").length
  const partialCount = familyEntries.filter((entry) => entry.status === "partial").length
  const blockedCount = familyEntries.filter((entry) => entry.status === "blocked").length
  const outputsReadyCount = familyEntries.filter((entry) => entry.outputsReady === true).length

  return {
    key: params.family.key,
    label: params.family.label,
    description: params.family.description,
    totalScenarios: familyEntries.length,
    readyCount,
    partialCount,
    blockedCount,
    outputsReadyCount,
    scenarioKeys: params.family.scenarioKeys,
  }
}
