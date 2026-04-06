import { describe, expect, it } from "vitest"

import type { HardeningRoadmapFamily } from "../hardening-roadmap/types"
import type { FamilyPriority, ScenarioPriority } from "../prioritization/types"
import { buildFamilyCoverageGaps } from "./build-family-coverage-gaps"

function fp(key: FamilyPriority["familyKey"], total: number, priority: FamilyPriority["priority"]): FamilyPriority {
  return { familyKey: key, score: total * 2, priority, totalScenarios: total }
}

function sp(
  scenarioKey: ScenarioPriority["scenarioKey"],
  familyKey: ScenarioPriority["familyKey"],
  priority: ScenarioPriority["priority"],
): ScenarioPriority {
  return {
    scenarioKey,
    familyKey,
    score: priority === "high" ? 10 : 2,
    priority,
    reasons: [],
  }
}

function rf(
  familyKey: HardeningRoadmapFamily["familyKey"],
  phase: HardeningRoadmapFamily["phase"],
): HardeningRoadmapFamily {
  return {
    familyKey,
    score: 1,
    priority: "low",
    phase,
    scenarios: [],
    totalScenarios: 0,
  }
}

describe("buildFamilyCoverageGaps", () => {
  it("zero scenarios in family => high gap", () => {
    const rows = buildFamilyCoverageGaps({
      familyPriorities: [fp("boundary_detection", 0, "low")],
      scenarioPriorities: [],
      roadmapFamilies: [rf("boundary_detection", 2)],
    })
    expect(rows[0]?.gapLevel).toBe("high")
    expect(rows[0]?.reasons).toContain("no_scenarios")
  })

  it("one scenario in family => high gap", () => {
    const rows = buildFamilyCoverageGaps({
      familyPriorities: [fp("happy_path", 2, "low")],
      scenarioPriorities: [sp("budget_simple_happy_path", "happy_path", "low")],
      roadmapFamilies: [rf("happy_path", 1)],
    })
    expect(rows[0]?.gapLevel).toBe("high")
    expect(rows[0]?.reasons).toContain("single_scenario_family")
  })

  it("two or more scenarios but none high priority => medium gap", () => {
    const rows = buildFamilyCoverageGaps({
      familyPriorities: [fp("happy_path", 2, "low")],
      scenarioPriorities: [
        sp("budget_simple_happy_path", "happy_path", "low"),
        sp("soa_simple_happy_path", "happy_path", "medium"),
      ],
      roadmapFamilies: [rf("happy_path", 1)],
    })
    expect(rows[0]?.gapLevel).toBe("medium")
    expect(rows[0]?.reasons).toContain("no_high_priority_scenarios")
  })

  it("adds late_phase_low_depth when roadmap phase 3 and totalScenarios <= 2", () => {
    const rows = buildFamilyCoverageGaps({
      familyPriorities: [fp("happy_path", 2, "low")],
      scenarioPriorities: [
        sp("budget_simple_happy_path", "happy_path", "high"),
        sp("soa_simple_happy_path", "happy_path", "low"),
      ],
      roadmapFamilies: [rf("happy_path", 3)],
    })
    expect(rows[0]?.gapLevel).toBe("medium")
    expect(rows[0]?.reasons).toContain("late_phase_low_depth")
  })

  it("well-covered family => low gap with coverage_depth_ok", () => {
    const rows = buildFamilyCoverageGaps({
      familyPriorities: [fp("happy_path", 2, "low")],
      scenarioPriorities: [
        sp("budget_simple_happy_path", "happy_path", "high"),
        sp("soa_simple_happy_path", "happy_path", "low"),
      ],
      roadmapFamilies: [rf("happy_path", 1)],
    })
    expect(rows[0]?.gapLevel).toBe("low")
    expect(rows[0]?.reasons).toEqual(["coverage_depth_ok"])
  })

  it("sorts by gap level then totalScenarios then familyKey", () => {
    const familyPriorities: FamilyPriority[] = [
      fp("visit_schedule", 1, "low"),
      fp("happy_path", 2, "low"),
      fp("sheet_selection", 0, "low"),
    ]
    const scenarioPriorities: ScenarioPriority[] = [
      sp("budget_simple_happy_path", "happy_path", "low"),
      sp("soa_simple_happy_path", "happy_path", "low"),
    ]
    const roadmapFamilies: HardeningRoadmapFamily[] = [
      rf("visit_schedule", 2),
      rf("happy_path", 2),
      rf("sheet_selection", 2),
    ]
    const keys = buildFamilyCoverageGaps({
      familyPriorities,
      scenarioPriorities,
      roadmapFamilies,
    }).map((r) => r.familyKey)

    const highFirst = keys.filter((k) =>
      ["sheet_selection", "visit_schedule"].includes(k),
    )
    expect(highFirst.length).toBeGreaterThan(0)
    expect(keys.indexOf("sheet_selection")).toBeLessThan(keys.indexOf("happy_path"))
  })
})
