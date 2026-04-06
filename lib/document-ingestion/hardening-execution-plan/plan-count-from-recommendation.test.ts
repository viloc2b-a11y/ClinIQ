import { describe, expect, it } from "vitest"

import type { HardeningRecommendation } from "../hardening-recommendations/types"
import { planCountFromRecommendation } from "./plan-count-from-recommendation"

function reco(
  type: HardeningRecommendation["type"],
  priority: HardeningRecommendation["priority"],
): HardeningRecommendation {
  const base = {
    code: "X",
    message: "m",
    suggestedActions: [],
  }
  if (type === "expand_family") {
    return { ...base, type, priority, target: { familyKey: "happy_path" as const } }
  }
  if (type === "expand_tag") {
    return { ...base, type, priority, target: { tag: "edge-case" } }
  }
  return { ...base, type, priority, target: { distribution: "tag_coverage" as const } }
}

describe("planCountFromRecommendation", () => {
  it("expand_family high => 3", () => {
    expect(planCountFromRecommendation(reco("expand_family", "high"))).toBe(3)
  })

  it("expand_family medium => 2", () => {
    expect(planCountFromRecommendation(reco("expand_family", "medium"))).toBe(2)
  })

  it("expand_tag high => 2", () => {
    expect(planCountFromRecommendation(reco("expand_tag", "high"))).toBe(2)
  })

  it("expand_tag medium => 1", () => {
    expect(planCountFromRecommendation(reco("expand_tag", "medium"))).toBe(1)
  })

  it("rebalance_distribution medium => 3", () => {
    expect(planCountFromRecommendation(reco("rebalance_distribution", "medium"))).toBe(3)
  })

  it("fallback => 1", () => {
    expect(planCountFromRecommendation(reco("expand_family", "low"))).toBe(1)
    expect(planCountFromRecommendation(reco("expand_tag", "low"))).toBe(1)
    expect(planCountFromRecommendation(reco("rebalance_distribution", "low"))).toBe(1)
  })
})
