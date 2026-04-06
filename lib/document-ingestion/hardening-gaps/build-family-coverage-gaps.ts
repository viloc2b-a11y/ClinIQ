import type { HardeningRoadmapFamily } from "../hardening-roadmap/types"
import type { FamilyPriority, ScenarioPriority } from "../prioritization/types"
import type { FamilyCoverageGap } from "./types"

export function buildFamilyCoverageGaps(args: {
  familyPriorities: FamilyPriority[]
  scenarioPriorities: ScenarioPriority[]
  roadmapFamilies: HardeningRoadmapFamily[]
}): FamilyCoverageGap[] {
  return args.familyPriorities
    .map((family) => {
      const familyScenarios = args.scenarioPriorities.filter(
        (item) => item.familyKey === family.familyKey,
      )

      const roadmapFamily =
        args.roadmapFamilies.find((item) => item.familyKey === family.familyKey) ?? null

      const totalScenarios = familyScenarios.length
      const highPriorityScenarios = familyScenarios.filter((item) => item.priority === "high").length
      const roadmapPhase = roadmapFamily?.phase ?? null

      const reasons: string[] = []
      let gapLevel: "high" | "medium" | "low" = "low"

      if (totalScenarios === 0) {
        gapLevel = "high"
        reasons.push("no_scenarios")
      } else if (totalScenarios === 1) {
        gapLevel = "high"
        reasons.push("single_scenario_family")
      } else if (highPriorityScenarios === 0) {
        gapLevel = "medium"
        reasons.push("no_high_priority_scenarios")
      }

      if (roadmapPhase === 3 && totalScenarios <= 2) {
        gapLevel = gapLevel === "high" ? "high" : "medium"
        reasons.push("late_phase_low_depth")
      }

      if (reasons.length === 0) {
        reasons.push("coverage_depth_ok")
      }

      return {
        familyKey: family.familyKey,
        totalScenarios,
        highPriorityScenarios,
        roadmapPhase,
        gapLevel,
        reasons,
      }
    })
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 }
      if (rank[a.gapLevel] !== rank[b.gapLevel]) {
        return rank[a.gapLevel] - rank[b.gapLevel]
      }
      if (a.totalScenarios !== b.totalScenarios) {
        return a.totalScenarios - b.totalScenarios
      }
      return a.familyKey.localeCompare(b.familyKey)
    })
}
