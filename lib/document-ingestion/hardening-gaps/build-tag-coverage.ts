import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"
import { listScenarioFamilies } from "../scenario-families/list-scenario-families"
import type { InternalScenarioKey } from "../scenarios/types"
import type { ScenarioPriority } from "../prioritization/types"
import { EXPECTED_COVERAGE_TAGS } from "./expected-coverage-tags"
import type { TagCoverageEntry } from "./types"

function scenarioToFamilyMap(): Map<InternalScenarioKey, ScenarioFamilyKey> {
  const map = new Map<InternalScenarioKey, ScenarioFamilyKey>()
  for (const family of listScenarioFamilies().data.families) {
    for (const key of family.scenarioKeys) {
      map.set(key, family.key)
    }
  }
  return map
}

export function buildTagCoverage(args: {
  catalog: ScenarioCatalogEntry[]
  scenarioPriorities: ScenarioPriority[]
}): TagCoverageEntry[] {
  const familyByScenario = scenarioToFamilyMap()

  return EXPECTED_COVERAGE_TAGS.map((tag) => {
    const matchingEntries = args.catalog.filter((entry) => entry.tags.includes(tag))

    const familySet = new Set<ScenarioFamilyKey>()
    for (const entry of matchingEntries) {
      const fam = familyByScenario.get(entry.key)
      if (fam != null) familySet.add(fam)
    }
    const families = [...familySet].sort((a, b) => a.localeCompare(b))

    const scenarioKeySet = new Set(matchingEntries.map((entry) => entry.key))

    const priorityWeight = args.scenarioPriorities
      .filter((item) => scenarioKeySet.has(item.scenarioKey))
      .reduce((sum, item) => sum + item.score, 0)

    const count = matchingEntries.length

    let coverageLevel: "strong" | "medium" | "weak" | "missing" = "missing"
    if (count >= 4) coverageLevel = "strong"
    else if (count >= 2) coverageLevel = "medium"
    else if (count === 1) coverageLevel = "weak"

    return {
      tag,
      count,
      families,
      priorityWeight,
      coverageLevel,
    }
  }).sort((a, b) => {
    if (a.coverageLevel !== b.coverageLevel) {
      const rank = { missing: 0, weak: 1, medium: 2, strong: 3 }
      return rank[a.coverageLevel] - rank[b.coverageLevel]
    }
    if (a.count !== b.count) return a.count - b.count
    return a.tag.localeCompare(b.tag)
  })
}
