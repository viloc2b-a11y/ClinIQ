import { describe, expect, it } from "vitest"

import { buildHardeningRoadmap } from "../hardening-roadmap/build-hardening-roadmap"
import { buildPrioritization } from "../prioritization/build-prioritization"
import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"
import { buildHardeningGaps } from "./build-hardening-gaps"
import { EXPECTED_COVERAGE_TAGS } from "./expected-coverage-tags"

const ALL_FAMILY_KEYS: ScenarioFamilyKey[] = [
  "happy_path",
  "sheet_selection",
  "boundary_detection",
  "header_variants",
  "row_structure",
  "visit_schedule",
]

function baseEntry(overrides: Partial<ScenarioCatalogEntry> = {}): ScenarioCatalogEntry {
  return {
    key: "budget_simple_happy_path",
    label: "L",
    description: "D",
    fixtureType: "excel_simple_budget",
    tags: ["budget", "simple", "happy-path", "excel"],
    fileName: null,
    sourceType: "excel",
    route: "unknown",
    status: "ready",
    outputsReady: true,
    artifactsReady: 0,
    totalWarnings: 0,
    documentKind: "sponsor_budget",
    ...overrides,
  }
}

describe("buildHardeningGaps", () => {
  it("returns result shape matching HardeningGapResult contract", () => {
    const catalog = [baseEntry()]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    const result = buildHardeningGaps({ catalog, prioritization, roadmap })

    expect(result.data.tagCoverage).toHaveLength(EXPECTED_COVERAGE_TAGS.length)
    expect(result.data.familyCoverageGaps.length).toBeGreaterThan(0)
    expect(Array.isArray(result.data.gaps)).toBe(true)
    expect(result.summary).toMatchObject({
      totalTags: EXPECTED_COVERAGE_TAGS.length,
      weakTagCount: expect.any(Number),
      missingTagCount: expect.any(Number),
      familiesWithHighGap: expect.any(Number),
      familiesWithMediumGap: expect.any(Number),
      familiesWithLowGap: expect.any(Number),
      topGapCode: expect.anything(),
    })
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it("emits tag gaps for missing and weak expected tags", () => {
    const catalog = [baseEntry({ tags: ["budget", "excel"] })]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    const result = buildHardeningGaps({ catalog, prioritization, roadmap })

    expect(result.data.gaps.some((g) => g.code.startsWith("TAG_MISSING_"))).toBe(true)
    const weakTags = result.data.tagCoverage.filter((t) => t.coverageLevel === "weak")
    if (weakTags.length > 0) {
      expect(result.data.gaps.some((g) => g.code.startsWith("TAG_WEAK_"))).toBe(true)
    }
  })

  it("emits family gaps for high and medium family gap levels", () => {
    const catalog = [
      baseEntry(),
      baseEntry({
        key: "soa_simple_happy_path",
        tags: ["soa", "simple", "schedule", "excel"],
        documentKind: "soa",
      }),
    ]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    const result = buildHardeningGaps({ catalog, prioritization, roadmap })

    expect(result.data.gaps.some((g) => g.code.startsWith("FAMILY_HIGH_GAP_"))).toBe(true)
    expect(result.data.gaps.some((g) => g.code === "FAMILY_MEDIUM_GAP_HAPPY_PATH")).toBe(true)
  })

  it("emits distribution gap when at least four tags are weak or missing", () => {
    const catalog = [baseEntry({ tags: ["budget", "excel"] })]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    const result = buildHardeningGaps({ catalog, prioritization, roadmap })

    const thin = result.data.tagCoverage.filter(
      (t) => t.coverageLevel === "weak" || t.coverageLevel === "missing",
    ).length
    expect(thin).toBeGreaterThanOrEqual(4)
    expect(result.data.gaps.some((g) => g.code === "DISTRIBUTION_TAG_COVERAGE_THIN")).toBe(true)
  })

  it("sets topGapCode to first gap after deterministic sort", () => {
    const catalog = [baseEntry()]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    const result = buildHardeningGaps({ catalog, prioritization, roadmap })

    const severityRank = { high: 0, medium: 1, low: 2 }
    const typeRank = { family: 0, tag: 1, distribution: 2 }
    const sorted = [...result.data.gaps].sort((a, b) => {
      if (severityRank[a.severity] !== severityRank[b.severity]) {
        return severityRank[a.severity] - severityRank[b.severity]
      }
      if (typeRank[a.type] !== typeRank[b.type]) {
        return typeRank[a.type] - typeRank[b.type]
      }
      return a.code.localeCompare(b.code)
    })
    expect(result.summary.topGapCode).toBe(sorted[0]?.code ?? null)
  })

  it("warns on empty catalog prioritization or roadmap", () => {
    const emptyPrio = buildPrioritization({ catalog: [], familyKeys: ALL_FAMILY_KEYS })
    const emptyRoadmap = buildHardeningRoadmap(emptyPrio)
    const r1 = buildHardeningGaps({
      catalog: [],
      prioritization: emptyPrio,
      roadmap: emptyRoadmap,
    })
    expect(r1.warnings.some((w) => w.code === "EMPTY_CATALOG")).toBe(true)
    expect(r1.warnings.some((w) => w.code === "EMPTY_PRIORITIZATION")).toBe(true)

    const catalog = [baseEntry()]
    const prio = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const emptyFamiliesRoadmap: typeof emptyRoadmap = {
      data: { families: [], scenarios: [] },
      summary: {
        totalFamilies: 0,
        totalScenarios: 0,
        phase1Families: 0,
        phase2Families: 0,
        phase3Families: 0,
        phase1Scenarios: 0,
        phase2Scenarios: 0,
        phase3Scenarios: 0,
        firstFamily: null,
        firstScenario: null,
      },
      warnings: [],
    }
    const r2 = buildHardeningGaps({ catalog, prioritization: prio, roadmap: emptyFamiliesRoadmap })
    expect(r2.warnings.some((w) => w.code === "EMPTY_ROADMAP")).toBe(true)
  })

  it("does not mutate catalog prioritization or roadmap inputs", () => {
    const catalog = [baseEntry(), baseEntry({ key: "soa_simple_happy_path", tags: ["soa", "excel"] })]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    const cSnap = structuredClone(catalog)
    const pSnap = structuredClone(prioritization)
    const rSnap = structuredClone(roadmap)

    buildHardeningGaps({ catalog, prioritization, roadmap })

    expect(catalog).toEqual(cSnap)
    expect(prioritization).toEqual(pSnap)
    expect(roadmap).toEqual(rSnap)
  })

  it("is deterministic for identical inputs", () => {
    const catalog = [baseEntry()]
    const prioritization = buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })
    const roadmap = buildHardeningRoadmap(prioritization)
    expect(buildHardeningGaps({ catalog, prioritization, roadmap })).toEqual(
      buildHardeningGaps({ catalog, prioritization, roadmap }),
    )
  })
})
