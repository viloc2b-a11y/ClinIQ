import type { FamilyPriority } from "../prioritization/types"
import { assignRoadmapPhase } from "./assign-roadmap-phase"
import type { HardeningRoadmapFamily, HardeningRoadmapScenario } from "./types"

export function buildRoadmapFamilies(args: {
  familyPriorities: FamilyPriority[]
  roadmapScenarios: HardeningRoadmapScenario[]
}): HardeningRoadmapFamily[] {
  return [...args.familyPriorities]
    .map((family) => {
      const scenarios = args.roadmapScenarios
        .filter((item) => item.familyKey === family.familyKey)
        .sort((a, b) => {
          if (a.phase !== b.phase) return a.phase - b.phase
          if (b.score !== a.score) return b.score - a.score
          return a.scenarioKey.localeCompare(b.scenarioKey)
        })

      return {
        familyKey: family.familyKey,
        score: family.score,
        priority: family.priority,
        phase: assignRoadmapPhase(family.priority),
        scenarios,
        totalScenarios: family.totalScenarios,
      }
    })
    .sort((a, b) => {
      if (a.phase !== b.phase) return a.phase - b.phase
      if (b.score !== a.score) return b.score - a.score
      return a.familyKey.localeCompare(b.familyKey)
    })
}
