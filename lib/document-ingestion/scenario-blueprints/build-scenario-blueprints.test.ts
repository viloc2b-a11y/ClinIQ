import { describe, expect, it } from "vitest"

import type { HardeningExecutionPlanResult } from "../hardening-execution-plan/types"
import { buildScenarioBlueprints } from "./build-scenario-blueprints"

function plan(overrides: Partial<HardeningExecutionPlanResult> = {}): HardeningExecutionPlanResult {
  return {
    data: { planItems: [] },
    summary: {
      totalPlanItems: 0,
      totalPlannedScenarios: 0,
      highPriorityItems: 0,
      mediumPriorityItems: 0,
      lowPriorityItems: 0,
      firstPlanItemCode: null,
    },
    warnings: [],
    ...overrides,
  }
}

describe("buildScenarioBlueprints", () => {
  it("matches ScenarioBlueprintResult contract and sequential order", () => {
    const executionPlan: HardeningExecutionPlanResult = plan({
      data: {
        planItems: [
          {
            code: "PLAN_FIRST",
            order: 1,
            type: "create_scenarios_for_tag",
            priority: "high",
            target: { tag: "z" },
            plannedScenarioCount: 1,
            suggestedFamilyKeys: [],
            rationale: [],
          },
          {
            code: "PLAN_SECOND",
            order: 2,
            type: "create_scenarios_for_family",
            priority: "high",
            target: { familyKey: "happy_path" },
            plannedScenarioCount: 2,
            suggestedFamilyKeys: ["happy_path"],
            rationale: [],
          },
        ],
      },
    })

    const result = buildScenarioBlueprints(executionPlan)
    expect(result.data.blueprints).toHaveLength(3)
    expect(result.data.blueprints.map((b) => b.order)).toEqual([1, 2, 3])
    expect(result.summary.totalBlueprints).toBe(3)
    expect(result.summary.edgeCaseExpansionCount + result.summary.familyDepthExpansionCount).toBe(3)
    expect(result.summary.firstBlueprintCode).toBe(result.data.blueprints[0]?.code ?? null)
    expect(
      result.summary.edgeCaseExpansionCount +
        result.summary.familyDepthExpansionCount +
        result.summary.distributionRebalanceCount,
    ).toBe(result.summary.totalBlueprints)
  })

  it("sorts by plan item order then proposedScenarioKey then code", () => {
    const executionPlan: HardeningExecutionPlanResult = plan({
      data: {
        planItems: [
          {
            code: "P2",
            order: 2,
            type: "create_scenarios_for_tag",
            priority: "medium",
            target: { tag: "b" },
            plannedScenarioCount: 1,
            suggestedFamilyKeys: [],
            rationale: [],
          },
          {
            code: "P1",
            order: 1,
            type: "create_scenarios_for_tag",
            priority: "high",
            target: { tag: "a" },
            plannedScenarioCount: 1,
            suggestedFamilyKeys: [],
            rationale: [],
          },
        ],
      },
    })

    const keys = buildScenarioBlueprints(executionPlan).data.blueprints.map((b) => b.proposedScenarioKey)
    expect(keys[0]).toContain("tag_a")
    expect(keys[1]).toContain("tag_b")
  })

  it("emits NO_BLUEPRINTS when plan is empty", () => {
    const result = buildScenarioBlueprints(plan())
    expect(result.data.blueprints).toHaveLength(0)
    expect(result.warnings.some((w) => w.code === "NO_BLUEPRINTS")).toBe(true)
    expect(result.summary.firstBlueprintCode).toBeNull()
  })

  it("does not mutate execution plan", () => {
    const executionPlan = plan({
      data: {
        planItems: [
          {
            code: "PX",
            order: 1,
            type: "create_scenarios_for_family",
            priority: "high",
            target: { familyKey: "visit_schedule" },
            plannedScenarioCount: 1,
            suggestedFamilyKeys: ["visit_schedule"],
            rationale: [],
          },
        ],
      },
    })
    const snap = structuredClone(executionPlan)
    buildScenarioBlueprints(executionPlan)
    expect(executionPlan).toEqual(snap)
  })

  it("is deterministic", () => {
    const executionPlan: HardeningExecutionPlanResult = plan({
      data: {
        planItems: [
          {
            code: "PX",
            order: 1,
            type: "rebalance_distribution",
            priority: "medium",
            target: { distribution: "tag_coverage" },
            plannedScenarioCount: 2,
            suggestedFamilyKeys: ["row_structure", "header_variants"],
            rationale: [],
          },
        ],
      },
    })
    expect(buildScenarioBlueprints(executionPlan)).toEqual(buildScenarioBlueprints(executionPlan))
  })
})
