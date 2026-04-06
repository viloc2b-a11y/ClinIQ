import { describe, expect, it } from "vitest"

import type { HardeningGapResult } from "../hardening-gaps/types"
import type { FamilyCoverageGap, TagCoverageEntry } from "../hardening-gaps/types"
import { buildHardeningRecommendations } from "./build-hardening-recommendations"

function emptyGapResult(): HardeningGapResult {
  return {
    data: {
      tagCoverage: [],
      familyCoverageGaps: [],
      gaps: [],
    },
    summary: {
      totalTags: 0,
      weakTagCount: 0,
      missingTagCount: 0,
      familiesWithHighGap: 0,
      familiesWithMediumGap: 0,
      familiesWithLowGap: 0,
      topGapCode: null,
    },
    warnings: [],
  }
}

describe("buildHardeningRecommendations", () => {
  it("aggregates tag family and distribution recommendations", () => {
    const tagCoverage: TagCoverageEntry[] = [
      {
        tag: "ambiguous",
        count: 0,
        families: [],
        priorityWeight: 0,
        coverageLevel: "missing",
      },
      {
        tag: "edge-case",
        count: 1,
        families: [],
        priorityWeight: 1,
        coverageLevel: "weak",
      },
      {
        tag: "multi-sheet",
        count: 0,
        families: [],
        priorityWeight: 0,
        coverageLevel: "missing",
      },
      {
        tag: "sparse-layout",
        count: 0,
        families: [],
        priorityWeight: 0,
        coverageLevel: "missing",
      },
    ]
    const familyCoverageGaps: FamilyCoverageGap[] = [
      {
        familyKey: "happy_path",
        totalScenarios: 0,
        highPriorityScenarios: 0,
        roadmapPhase: null,
        gapLevel: "high",
        reasons: ["no_scenarios"],
      },
    ]
    const gaps: HardeningGapResult = {
      ...emptyGapResult(),
      data: {
        tagCoverage,
        familyCoverageGaps,
        gaps: [],
      },
    }

    const result = buildHardeningRecommendations(gaps)
    const codes = result.data.recommendations.map((r) => r.code)

    expect(codes).toContain("RECO_FAMILY_HIGH_HAPPY_PATH")
    expect(codes).toContain("RECO_DISTRIBUTION_TAG_IMBALANCE")
    expect(codes.some((c) => c.startsWith("RECO_TAG_MISSING_"))).toBe(true)
    expect(codes.some((c) => c.startsWith("RECO_TAG_WEAK_"))).toBe(true)
  })

  it("sorts priority high first then type expand_family before expand_tag before distribution", () => {
    const gaps: HardeningGapResult = {
      ...emptyGapResult(),
      data: {
        tagCoverage: [
          {
            tag: "ambiguous",
            count: 0,
            families: [],
            priorityWeight: 0,
            coverageLevel: "missing",
          },
        ],
        familyCoverageGaps: [
          {
            familyKey: "sheet_selection",
            totalScenarios: 0,
            highPriorityScenarios: 0,
            roadmapPhase: null,
            gapLevel: "high",
            reasons: [],
          },
        ],
        gaps: [],
      },
    }

    const result = buildHardeningRecommendations(gaps)
    expect(result.data.recommendations[0]?.type).toBe("expand_family")
    expect(result.data.recommendations[0]?.code).toBe("RECO_FAMILY_HIGH_SHEET_SELECTION")
    expect(result.data.recommendations[1]?.type).toBe("expand_tag")
  })

  it("computes summary counts and topRecommendationCode", () => {
    const gaps: HardeningGapResult = {
      ...emptyGapResult(),
      data: {
        tagCoverage: [
          {
            tag: "x",
            count: 0,
            families: [],
            priorityWeight: 0,
            coverageLevel: "missing",
          },
        ],
        familyCoverageGaps: [
          {
            familyKey: "boundary_detection",
            totalScenarios: 0,
            highPriorityScenarios: 0,
            roadmapPhase: null,
            gapLevel: "medium",
            reasons: [],
          },
        ],
        gaps: [],
      },
    }

    const result = buildHardeningRecommendations(gaps)
    expect(result.summary.totalRecommendations).toBe(result.data.recommendations.length)
    expect(
      result.summary.highPriority + result.summary.mediumPriority + result.summary.lowPriority,
    ).toBe(result.summary.totalRecommendations)
    expect(result.summary.topRecommendationCode).toBe(result.data.recommendations[0]?.code ?? null)
    expect(result.summary.highPriority).toBe(1)
    expect(result.summary.mediumPriority).toBe(1)
  })

  it("emits NO_RECOMMENDATIONS warning when nothing is produced", () => {
    const result = buildHardeningRecommendations(emptyGapResult())
    expect(result.data.recommendations).toHaveLength(0)
    expect(result.warnings.some((w) => w.code === "NO_RECOMMENDATIONS")).toBe(true)
    expect(result.summary.topRecommendationCode).toBeNull()
  })

  it("is deterministic for identical gap input", () => {
    const gaps: HardeningGapResult = {
      ...emptyGapResult(),
      data: {
        tagCoverage: [
          {
            tag: "ambiguous",
            count: 0,
            families: [],
            priorityWeight: 0,
            coverageLevel: "missing",
          },
        ],
        familyCoverageGaps: [],
        gaps: [],
      },
    }
    expect(buildHardeningRecommendations(gaps)).toEqual(buildHardeningRecommendations(gaps))
  })
})
