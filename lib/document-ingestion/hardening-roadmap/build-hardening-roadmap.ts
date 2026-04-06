import type { PrioritizationResult } from "../prioritization/types"
import { buildRoadmapFamilies } from "./build-roadmap-families"
import { buildRoadmapScenarios } from "./build-roadmap-scenarios"
import type { HardeningRoadmapResult } from "./types"

export function buildHardeningRoadmap(prioritization: PrioritizationResult): HardeningRoadmapResult {
  const warnings: HardeningRoadmapResult["warnings"] = []

  const roadmapScenarios = buildRoadmapScenarios(prioritization.data.scenarioPriorities)

  const roadmapFamilies = buildRoadmapFamilies({
    familyPriorities: prioritization.data.familyPriorities,
    roadmapScenarios,
  })

  if (roadmapScenarios.length === 0) {
    warnings.push({
      code: "EMPTY_ROADMAP_SCENARIOS",
      message: "No roadmap scenarios could be generated.",
      severity: "warning",
    })
  }

  if (roadmapFamilies.length === 0) {
    warnings.push({
      code: "EMPTY_ROADMAP_FAMILIES",
      message: "No roadmap families could be generated.",
      severity: "warning",
    })
  }

  const phase1Families = roadmapFamilies.filter((item) => item.phase === 1).length
  const phase2Families = roadmapFamilies.filter((item) => item.phase === 2).length
  const phase3Families = roadmapFamilies.filter((item) => item.phase === 3).length

  const phase1Scenarios = roadmapScenarios.filter((item) => item.phase === 1).length
  const phase2Scenarios = roadmapScenarios.filter((item) => item.phase === 2).length
  const phase3Scenarios = roadmapScenarios.filter((item) => item.phase === 3).length

  return {
    data: {
      families: roadmapFamilies,
      scenarios: roadmapScenarios,
    },
    summary: {
      totalFamilies: roadmapFamilies.length,
      totalScenarios: roadmapScenarios.length,
      phase1Families,
      phase2Families,
      phase3Families,
      phase1Scenarios,
      phase2Scenarios,
      phase3Scenarios,
      firstFamily: roadmapFamilies[0]?.familyKey ?? null,
      firstScenario: roadmapScenarios[0]?.scenarioKey ?? null,
    },
    warnings,
  }
}
