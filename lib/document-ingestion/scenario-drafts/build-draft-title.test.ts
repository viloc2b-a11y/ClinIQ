import { describe, expect, it } from "vitest"

import { buildDraftTitle } from "./build-draft-title"

describe("buildDraftTitle", () => {
  it("removes leading scenario_ prefix", () => {
    expect(buildDraftTitle("scenario_happy_path_expansion_1")).toBe("Happy Path Expansion 1")
  })

  it("replaces underscores with spaces", () => {
    expect(buildDraftTitle("scenario_tag_edge_case_2")).toBe("Tag Edge Case 2")
  })

  it("title-cases each word", () => {
    expect(buildDraftTitle("scenario_distribution_rebalance_1")).toBe("Distribution Rebalance 1")
  })

  it("falls back to Scenario Draft when nothing remains", () => {
    expect(buildDraftTitle("")).toBe("Scenario Draft")
    expect(buildDraftTitle("scenario_")).toBe("Scenario Draft")
  })
})
