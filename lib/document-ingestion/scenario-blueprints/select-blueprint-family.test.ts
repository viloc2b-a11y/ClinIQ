import { describe, expect, it } from "vitest"

import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import { selectBlueprintFamily } from "./select-blueprint-family"

describe("selectBlueprintFamily", () => {
  it("returns target family for create_scenarios_for_family", () => {
    const planItem = {
      type: "create_scenarios_for_family",
      target: { familyKey: "sheet_selection" as const },
      suggestedFamilyKeys: [],
    } as unknown as HardeningPlanItem
    expect(selectBlueprintFamily({ planItem, itemIndex: 0 })).toBe("sheet_selection")
  })

  it("uses indexed suggestion for tag item", () => {
    const planItem = {
      type: "create_scenarios_for_tag",
      target: { tag: "x" },
      suggestedFamilyKeys: ["happy_path", "row_structure"] as const,
    } as unknown as HardeningPlanItem
    expect(selectBlueprintFamily({ planItem, itemIndex: 0 })).toBe("happy_path")
    expect(selectBlueprintFamily({ planItem, itemIndex: 1 })).toBe("row_structure")
  })

  it("falls back to first suggestion when index out of range", () => {
    const planItem = {
      type: "create_scenarios_for_tag",
      target: { tag: "x" },
      suggestedFamilyKeys: ["visit_schedule"] as const,
    } as unknown as HardeningPlanItem
    expect(selectBlueprintFamily({ planItem, itemIndex: 5 })).toBe("visit_schedule")
  })

  it("returns null when no suggestions for tag/distribution", () => {
    const planItem = {
      type: "rebalance_distribution",
      target: { distribution: "tag_coverage" as const },
      suggestedFamilyKeys: [],
    } as unknown as HardeningPlanItem
    expect(selectBlueprintFamily({ planItem, itemIndex: 0 })).toBeNull()
  })
})
