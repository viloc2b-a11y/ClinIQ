import { listScenarioFamilies } from "../scenario-families/list-scenario-families"
import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"
import type { InternalScenarioKey } from "../scenarios/types"
import { scoreFamilyPriority } from "./score-family-priority"
import { scoreScenarioPriority } from "./score-scenario-priority"
import type { PrioritizationResult, ScenarioPriority } from "./types"

function buildScenarioToFamilyMap(): Map<InternalScenarioKey, ScenarioFamilyKey> {
  const map = new Map<InternalScenarioKey, ScenarioFamilyKey>()
  for (const family of listScenarioFamilies().data.families) {
    for (const scenarioKey of family.scenarioKeys) {
      map.set(scenarioKey, family.key)
    }
  }
  return map
}

export function buildPrioritization(args: {
  catalog: ScenarioCatalogEntry[]
  familyKeys: ScenarioFamilyKey[]
}): PrioritizationResult {
  const warnings: PrioritizationResult["warnings"] = []
  const familyByScenario = buildScenarioToFamilyMap()

  const scenarioPriorities: ScenarioPriority[] = args.catalog
    .flatMap((entry) => {
      const scenarioKey = entry.key as InternalScenarioKey
      const familyKey = familyByScenario.get(scenarioKey)
      if (familyKey == null) {
        return []
      }
      const scored = scoreScenarioPriority(entry)
      return [
        {
          scenarioKey,
          familyKey,
          score: scored.score,
          priority: scored.priority,
          reasons: scored.reasons,
        },
      ]
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.scenarioKey.localeCompare(b.scenarioKey)
    })

  const familyPriorities = args.familyKeys
    .map((familyKey) =>
      scoreFamilyPriority({
        familyKey,
        scenarioPriorities,
      }),
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.familyKey.localeCompare(b.familyKey)
    })

  const highPriorityCount = scenarioPriorities.filter(
    (item) => item.priority === "high",
  ).length

  const mediumPriorityCount = scenarioPriorities.filter(
    (item) => item.priority === "medium",
  ).length

  const lowPriorityCount = scenarioPriorities.filter((item) => item.priority === "low").length

  if (scenarioPriorities.length === 0) {
    warnings.push({
      code: "EMPTY_SCENARIO_PRIORITIES",
      message: "No scenario priorities could be computed.",
      severity: "warning",
    })
  }

  if (familyPriorities.length === 0) {
    warnings.push({
      code: "EMPTY_FAMILY_PRIORITIES",
      message: "No family priorities could be computed.",
      severity: "warning",
    })
  }

  return {
    data: {
      scenarioPriorities,
      familyPriorities,
    },
    summary: {
      totalScenarios: scenarioPriorities.length,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      topScenario: scenarioPriorities[0]?.scenarioKey ?? null,
      topFamily: familyPriorities[0]?.familyKey ?? null,
    },
    warnings,
  }
}
