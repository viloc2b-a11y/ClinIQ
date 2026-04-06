import { describe, expect, it } from "vitest"

import type { ScenarioPriority } from "./types"
import { scoreFamilyPriority } from "./score-family-priority"

function scenarioPriority(
  overrides: Partial<ScenarioPriority> & Pick<ScenarioPriority, "scenarioKey" | "familyKey" | "score">,
): ScenarioPriority {
  return {
    priority: "low",
    reasons: [],
    ...overrides,
  }
}

describe("scoreFamilyPriority", () => {
  it("aggregates scenario scores for the family", () => {
    const scenarioPriorities: ScenarioPriority[] = [
      scenarioPriority({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 5,
        priority: "medium",
        reasons: [],
      }),
      scenarioPriority({
        scenarioKey: "soa_simple_happy_path",
        familyKey: "happy_path",
        score: 3,
        priority: "low",
        reasons: [],
      }),
    ]

    const result = scoreFamilyPriority({
      familyKey: "happy_path",
      scenarioPriorities,
    })

    expect(result.score).toBe(8)
    expect(result.totalScenarios).toBe(2)
    expect(result.priority).toBe("medium")
  })

  it("counts totalScenarios only for matching familyKey", () => {
    const scenarioPriorities: ScenarioPriority[] = [
      scenarioPriority({
        scenarioKey: "budget_sparse_rows",
        familyKey: "row_structure",
        score: 10,
        priority: "high",
        reasons: [],
      }),
      scenarioPriority({
        scenarioKey: "visit_schedule_basic",
        familyKey: "visit_schedule",
        score: 1,
        priority: "low",
        reasons: [],
      }),
    ]

    const row = scoreFamilyPriority({
      familyKey: "row_structure",
      scenarioPriorities,
    })
    expect(row.totalScenarios).toBe(1)
    expect(row.score).toBe(10)
    expect(row.priority).toBe("medium")
  })

  it("applies deterministic family priority thresholds", () => {
    const scenarioPriorities: ScenarioPriority[] = [
      scenarioPriority({
        scenarioKey: "budget_simple_happy_path",
        familyKey: "happy_path",
        score: 8,
        priority: "high",
        reasons: [],
      }),
      scenarioPriority({
        scenarioKey: "soa_simple_happy_path",
        familyKey: "happy_path",
        score: 8,
        priority: "high",
        reasons: [],
      }),
    ]

    const high = scoreFamilyPriority({ familyKey: "happy_path", scenarioPriorities })
    expect(high.score).toBe(16)
    expect(high.priority).toBe("high")

    const mediumOnly = scoreFamilyPriority({
      familyKey: "happy_path",
      scenarioPriorities: [
        scenarioPriority({
          scenarioKey: "budget_simple_happy_path",
          familyKey: "happy_path",
          score: 4,
          priority: "medium",
          reasons: [],
        }),
        scenarioPriority({
          scenarioKey: "soa_simple_happy_path",
          familyKey: "happy_path",
          score: 4,
          priority: "medium",
          reasons: [],
        }),
      ],
    })
    expect(mediumOnly.score).toBe(8)
    expect(mediumOnly.priority).toBe("medium")

    const low = scoreFamilyPriority({
      familyKey: "happy_path",
      scenarioPriorities: [
        scenarioPriority({
          scenarioKey: "budget_simple_happy_path",
          familyKey: "happy_path",
          score: 3,
          priority: "low",
          reasons: [],
        }),
      ],
    })
    expect(low.score).toBe(3)
    expect(low.priority).toBe("low")
  })

  it("empty family returns score 0, low priority, totalScenarios 0", () => {
    const scenarioPriorities: ScenarioPriority[] = [
      scenarioPriority({
        scenarioKey: "visit_schedule_basic",
        familyKey: "visit_schedule",
        score: 9,
        priority: "high",
        reasons: [],
      }),
    ]

    const result = scoreFamilyPriority({
      familyKey: "happy_path",
      scenarioPriorities,
    })

    expect(result.familyKey).toBe("happy_path")
    expect(result.score).toBe(0)
    expect(result.priority).toBe("low")
    expect(result.totalScenarios).toBe(0)
  })
})
