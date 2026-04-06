import { describe, expect, it } from "vitest"

import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import { buildBlueprintsFromPlanItem } from "./build-blueprints-from-plan-item"

describe("buildBlueprintsFromPlanItem", () => {
  it("returns N blueprints from plannedScenarioCount", () => {
    const planItem: HardeningPlanItem = {
      code: "PLAN_A",
      order: 1,
      type: "create_scenarios_for_family",
      priority: "high",
      target: { familyKey: "happy_path" },
      plannedScenarioCount: 3,
      suggestedFamilyKeys: ["happy_path"],
      rationale: [],
    }
    const rows = buildBlueprintsFromPlanItem(planItem)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.code)).toEqual([
      "BLUEPRINT_PLAN_A_1",
      "BLUEPRINT_PLAN_A_2",
      "BLUEPRINT_PLAN_A_3",
    ])
  })

  it("preserves sourcePlanItemCode and rationale markers", () => {
    const planItem: HardeningPlanItem = {
      code: "PLAN_B",
      order: 2,
      type: "create_scenarios_for_tag",
      priority: "high",
      target: { tag: "ambiguous" },
      plannedScenarioCount: 1,
      suggestedFamilyKeys: ["header_variants"],
      rationale: [],
    }
    const [row] = buildBlueprintsFromPlanItem(planItem)
    expect(row?.sourcePlanItemCode).toBe("PLAN_B")
    expect(row?.rationale).toContain("blueprint_generated_from_plan")
    expect(row?.rationale).toContain("source_plan_item:PLAN_B")
    expect(row?.rationale).toContain("structure_intent:edge_case_expansion")
    expect(row?.targetTags).toEqual(["ambiguous"])
    expect(row?.familyKey).toBe("header_variants")
  })
})
