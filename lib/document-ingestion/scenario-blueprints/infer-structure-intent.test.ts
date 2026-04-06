import { describe, expect, it } from "vitest"

import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import { inferStructureIntent } from "./infer-structure-intent"

function base(overrides: Partial<HardeningPlanItem>): HardeningPlanItem {
  return {
    code: "P",
    order: 1,
    priority: "high",
    plannedScenarioCount: 1,
    suggestedFamilyKeys: [],
    rationale: [],
    ...overrides,
  } as HardeningPlanItem
}

describe("inferStructureIntent", () => {
  it("tag plan item => edge_case_expansion", () => {
    const item = base({
      type: "create_scenarios_for_tag",
      target: { tag: "edge-case" },
    })
    expect(inferStructureIntent(item)).toBe("edge_case_expansion")
  })

  it("family plan item => family_depth_expansion", () => {
    const item = base({
      type: "create_scenarios_for_family",
      target: { familyKey: "happy_path" },
    })
    expect(inferStructureIntent(item)).toBe("family_depth_expansion")
  })

  it("distribution plan item => distribution_rebalance", () => {
    const item = base({
      type: "rebalance_distribution",
      target: { distribution: "tag_coverage" },
    })
    expect(inferStructureIntent(item)).toBe("distribution_rebalance")
  })
})
