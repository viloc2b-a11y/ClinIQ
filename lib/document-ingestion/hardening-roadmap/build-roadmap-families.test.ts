import { describe, expect, it } from "vitest"

import type { FamilyPriority } from "../prioritization/types"
import type { HardeningRoadmapScenario } from "./types"
import { assignRoadmapPhase } from "./assign-roadmap-phase"
import { buildRoadmapFamilies } from "./build-roadmap-families"

function scenario(
  overrides: Partial<HardeningRoadmapScenario> &
    Pick<HardeningRoadmapScenario, "scenarioKey" | "familyKey">,
): HardeningRoadmapScenario {
  return {
    score: 0,
    priority: "low",
    reasons: [],
    phase: 3,
    ...overrides,
  }
}

describe("buildRoadmapFamilies", () => {
  it("includes only scenarios for each familyKey", () => {
    const roadmapScenarios: HardeningRoadmapScenario[] = [
      scenario({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 3,
        phase: 3,
        priority: "low",
        reasons: [],
      }),
      scenario({
        scenarioKey: "visit_schedule_basic",
        familyKey: "visit_schedule",
        score: 2,
        phase: 3,
        priority: "low",
        reasons: [],
      }),
    ]
    const familyPriorities: FamilyPriority[] = [
      { familyKey: "happy_path", score: 3, priority: "low", totalScenarios: 1 },
      { familyKey: "visit_schedule", score: 2, priority: "low", totalScenarios: 1 },
    ]

    const families = buildRoadmapFamilies({ familyPriorities, roadmapScenarios })
    const happy = families.find((f) => f.familyKey === "happy_path")
    expect(happy?.scenarios.map((s) => s.scenarioKey)).toEqual(["budget_simple_happy_path"])
    happy?.scenarios.forEach((s) => expect(s.familyKey).toBe("happy_path"))
  })

  it("derives family phase from family priority", () => {
    const familyPriorities: FamilyPriority[] = [
      { familyKey: "header_variants", score: 20, priority: "high", totalScenarios: 1 },
    ]
    const roadmapScenarios: HardeningRoadmapScenario[] = [
      scenario({
        scenarioKey: "budget_duplicate_headers",
        familyKey: "header_variants",
        score: 10,
        phase: 2,
        priority: "medium",
        reasons: [],
      }),
    ]

    const [fam] = buildRoadmapFamilies({ familyPriorities, roadmapScenarios })
    expect(fam?.phase).toBe(assignRoadmapPhase("high"))
    expect(fam?.phase).toBe(1)
  })

  it("sorts families phase asc, score desc, familyKey asc", () => {
    const familyPriorities: FamilyPriority[] = [
      { familyKey: "visit_schedule", score: 1, priority: "low", totalScenarios: 0 },
      { familyKey: "happy_path", score: 10, priority: "medium", totalScenarios: 1 },
      { familyKey: "row_structure", score: 9, priority: "medium", totalScenarios: 0 },
    ]
    const roadmapScenarios: HardeningRoadmapScenario[] = [
      scenario({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 5,
        phase: 2,
        priority: "medium",
        reasons: [],
      }),
    ]

    const keys = buildRoadmapFamilies({ familyPriorities, roadmapScenarios }).map((f) => f.familyKey)
    expect(keys).toEqual(["happy_path", "row_structure", "visit_schedule"])
  })

  it("sorts scenarios inside each family phase asc, score desc, scenarioKey asc", () => {
    const familyPriorities: FamilyPriority[] = [
      { familyKey: "happy_path", score: 20, priority: "high", totalScenarios: 2 },
    ]
    const roadmapScenarios: HardeningRoadmapScenario[] = [
      scenario({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 3,
        phase: 3,
        priority: "low",
        reasons: [],
      }),
      scenario({
        scenarioKey: "soa_simple_happy_path",
        familyKey: "happy_path",
        score: 10,
        phase: 1,
        priority: "high",
        reasons: [],
      }),
    ]

    const [fam] = buildRoadmapFamilies({ familyPriorities, roadmapScenarios })
    expect(fam?.scenarios.map((s) => s.scenarioKey)).toEqual([
      "soa_simple_happy_path",
      "budget_simple_happy_path",
    ])
  })

  it("handles a family with no matching scenarios without crashing", () => {
    const familyPriorities: FamilyPriority[] = [
      { familyKey: "boundary_detection", score: 0, priority: "low", totalScenarios: 0 },
    ]
    const roadmapScenarios: HardeningRoadmapScenario[] = []

    const [fam] = buildRoadmapFamilies({ familyPriorities, roadmapScenarios })
    expect(fam?.scenarios).toEqual([])
    expect(fam?.totalScenarios).toBe(0)
  })

  it("does not mutate familyPriorities or roadmapScenarios", () => {
    const familyPriorities: FamilyPriority[] = [
      { familyKey: "happy_path", score: 1, priority: "low", totalScenarios: 1 },
    ]
    const roadmapScenarios: HardeningRoadmapScenario[] = [
      scenario({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 1,
        phase: 3,
        priority: "low",
        reasons: ["x"],
      }),
    ]
    const fpSnap = structuredClone(familyPriorities)
    const rsSnap = structuredClone(roadmapScenarios)

    buildRoadmapFamilies({ familyPriorities, roadmapScenarios })

    expect(familyPriorities).toEqual(fpSnap)
    expect(roadmapScenarios).toEqual(rsSnap)
  })
})
