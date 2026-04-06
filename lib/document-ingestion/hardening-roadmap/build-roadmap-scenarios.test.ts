import { describe, expect, it } from "vitest"

import type { ScenarioPriority } from "../prioritization/types"
import { buildRoadmapScenarios } from "./build-roadmap-scenarios"

function sp(overrides: Partial<ScenarioPriority> & Pick<ScenarioPriority, "scenarioKey" | "familyKey">): ScenarioPriority {
  return {
    score: 0,
    priority: "low",
    reasons: [],
    ...overrides,
  }
}

describe("buildRoadmapScenarios", () => {
  it("maps fields and assigns phase from priority", () => {
    const input: ScenarioPriority[] = [
      sp({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 7,
        priority: "medium",
        reasons: ["excel_source"],
      }),
    ]
    const out = buildRoadmapScenarios(input)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      scenarioKey: "budget_simple_happy_path",
      familyKey: "happy_path",
      score: 7,
      priority: "medium",
      phase: 2,
    })
    expect(out[0]!.reasons).toEqual(["excel_source"])
  })

  it("sorts phase asc, score desc, familyKey asc, scenarioKey asc", () => {
    const input: ScenarioPriority[] = [
      sp({
        scenarioKey: "visit_schedule_basic",
        familyKey: "visit_schedule",
        score: 9,
        priority: "high",
        reasons: [],
      }),
      sp({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 3,
        priority: "low",
        reasons: [],
      }),
      sp({
        scenarioKey: "soa_simple_happy_path",
        familyKey: "happy_path",
        score: 5,
        priority: "low",
        reasons: [],
      }),
      sp({
        scenarioKey: "budget_sparse_rows",
        familyKey: "row_structure",
        score: 4,
        priority: "low",
        reasons: [],
      }),
    ]
    const keys = buildRoadmapScenarios(input).map((s) => s.scenarioKey)
    expect(keys).toEqual([
      "visit_schedule_basic",
      "soa_simple_happy_path",
      "budget_sparse_rows",
      "budget_simple_happy_path",
    ])
  })

  it("copies reasons without mutating the input array or reason arrays", () => {
    const reasons = ["a", "b"]
    const input: ScenarioPriority[] = [
      sp({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 1,
        priority: "low",
        reasons,
      }),
    ]
    const snapshot = structuredClone(input)
    const out = buildRoadmapScenarios(input)

    out[0]!.reasons.push("c")
    expect(input[0]!.reasons).toEqual(["a", "b"])
    expect(input).toEqual(snapshot)
  })
})
