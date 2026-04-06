import { describe, expect, it } from "vitest"

import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import { buildBlueprintKey } from "./build-blueprint-key"

describe("buildBlueprintKey", () => {
  it("family key format and 1-based numbering", () => {
    const planItem = {
      type: "create_scenarios_for_family",
      target: { familyKey: "happy_path" as const },
    } as HardeningPlanItem
    expect(buildBlueprintKey({ planItem, itemIndex: 0 })).toBe("scenario_happy_path_expansion_1")
    expect(buildBlueprintKey({ planItem, itemIndex: 2 })).toBe("scenario_happy_path_expansion_3")
  })

  it("tag key format with normalization", () => {
    const planItem = {
      type: "create_scenarios_for_tag",
      target: { tag: "Edge-Case!!" },
    } as HardeningPlanItem
    expect(buildBlueprintKey({ planItem, itemIndex: 0 })).toBe("scenario_tag_edge_case_1")
  })

  it("distribution key format", () => {
    const planItem = {
      type: "rebalance_distribution",
      target: { distribution: "tag_coverage" as const },
    } as HardeningPlanItem
    expect(buildBlueprintKey({ planItem, itemIndex: 1 })).toBe("scenario_distribution_rebalance_2")
  })
})
