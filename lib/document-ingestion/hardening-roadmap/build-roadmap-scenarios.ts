import type { ScenarioPriority } from "../prioritization/types"
import { assignRoadmapPhase } from "./assign-roadmap-phase"
import type { HardeningRoadmapScenario } from "./types"

export function buildRoadmapScenarios(
  scenarioPriorities: ScenarioPriority[],
): HardeningRoadmapScenario[] {
  return [...scenarioPriorities]
    .map((item) => ({
      scenarioKey: item.scenarioKey,
      familyKey: item.familyKey,
      score: item.score,
      priority: item.priority,
      reasons: [...item.reasons],
      phase: assignRoadmapPhase(item.priority),
    }))
    .sort((a, b) => {
      if (a.phase !== b.phase) return a.phase - b.phase
      if (b.score !== a.score) return b.score - a.score
      if (a.familyKey !== b.familyKey) return a.familyKey.localeCompare(b.familyKey)
      return a.scenarioKey.localeCompare(b.scenarioKey)
    })
}
