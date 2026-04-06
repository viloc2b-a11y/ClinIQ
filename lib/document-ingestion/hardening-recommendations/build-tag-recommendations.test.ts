import { describe, expect, it } from "vitest"

import type { TagCoverageEntry } from "../hardening-gaps/types"
import { buildTagRecommendations } from "./build-tag-recommendations"

function tagRow(
  tag: string,
  coverageLevel: TagCoverageEntry["coverageLevel"],
): TagCoverageEntry {
  return {
    tag,
    count: coverageLevel === "missing" ? 0 : coverageLevel === "weak" ? 1 : 2,
    families: [],
    priorityWeight: 0,
    coverageLevel,
  }
}

describe("buildTagRecommendations", () => {
  it("emits high priority for missing tags", () => {
    const rows = buildTagRecommendations([tagRow("ambiguous", "missing")])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.priority).toBe("high")
    expect(rows[0]?.code).toBe("RECO_TAG_MISSING_AMBIGUOUS")
    expect(rows[0]?.target).toEqual({ tag: "ambiguous" })
  })

  it("emits medium priority for weak tags", () => {
    const rows = buildTagRecommendations([tagRow("edge-case", "weak")])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.priority).toBe("medium")
    expect(rows[0]?.code).toBe("RECO_TAG_WEAK_EDGE_CASE")
  })

  it("ignores medium and strong coverage", () => {
    const rows = buildTagRecommendations([
      tagRow("a", "medium"),
      tagRow("b", "strong"),
    ])
    expect(rows).toHaveLength(0)
  })

  it("orders deterministically by code", () => {
    const rows = buildTagRecommendations([
      tagRow("zzz-missing", "missing"),
      tagRow("aaa-missing", "missing"),
    ])
    expect(rows.map((r) => r.code)).toEqual([
      "RECO_TAG_MISSING_AAA_MISSING",
      "RECO_TAG_MISSING_ZZZ_MISSING",
    ])
  })

  it("does not mutate tag coverage input", () => {
    const tagCoverage: TagCoverageEntry[] = [tagRow("ambiguous", "missing")]
    const snap = structuredClone(tagCoverage)
    buildTagRecommendations(tagCoverage)
    expect(tagCoverage).toEqual(snap)
  })
})
