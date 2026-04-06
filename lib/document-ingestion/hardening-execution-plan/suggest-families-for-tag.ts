import type { FamilyCoverageGap } from "../hardening-gaps/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"

export function suggestFamiliesForTag(familyGaps: FamilyCoverageGap[]): ScenarioFamilyKey[] {
  const rank = { high: 0, medium: 1, low: 2 }

  return [...familyGaps]
    .sort((a, b) => {
      if (rank[a.gapLevel] !== rank[b.gapLevel]) {
        return rank[a.gapLevel] - rank[b.gapLevel]
      }
      if (a.totalScenarios !== b.totalScenarios) {
        return a.totalScenarios - b.totalScenarios
      }
      return a.familyKey.localeCompare(b.familyKey)
    })
    .slice(0, 3)
    .map((item) => item.familyKey)
}
