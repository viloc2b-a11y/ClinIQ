import { describe, expect, it } from "vitest"

import { buildPrioritization } from "../prioritization/build-prioritization"
import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"
import { buildHardeningRoadmap } from "./build-hardening-roadmap"

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
    tags: [],
    fileName: null,
    sourceType: "unknown",
    route: "unknown",
    status: "ready",
    outputsReady: true,
    artifactsReady: 0,
    totalWarnings: 0,
    documentKind: "unknown",
    ...overrides,
  }
}

describe("buildHardeningRoadmap", () => {
  it("returns result shape matching HardeningRoadmapResult contract", () => {
    const prioritization = buildPrioritization({
      catalog: [baseEntry()],
      familyKeys: ALL_FAMILY_KEYS,
    })
    const roadmap = buildHardeningRoadmap(prioritization)

    expect(roadmap.data).toHaveProperty("families")
    expect(roadmap.data).toHaveProperty("scenarios")
    expect(roadmap.summary).toMatchObject({
      totalFamilies: expect.any(Number),
      totalScenarios: expect.any(Number),
      phase1Families: expect.any(Number),
      phase2Families: expect.any(Number),
      phase3Families: expect.any(Number),
      phase1Scenarios: expect.any(Number),
      phase2Scenarios: expect.any(Number),
      phase3Scenarios: expect.any(Number),
      firstFamily: expect.anything(),
      firstScenario: expect.anything(),
    })
    expect(Array.isArray(roadmap.warnings)).toBe(true)
  })

  it("summary counts match roadmapFamilies and roadmapScenarios", () => {
    const prioritization = buildPrioritization({
      catalog: [
        baseEntry({
          key: "budget_duplicate_headers",
          sourceType: "excel",
          tags: ["edge-case"],
          documentKind: "sponsor_budget",
        }),
        baseEntry({
          key: "budget_simple_happy_path",
          sourceType: "pdf",
          documentKind: "unknown",
          tags: [],
        }),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    })

    const roadmap = buildHardeningRoadmap(prioritization)
    expect(roadmap.summary.totalScenarios).toBe(roadmap.data.scenarios.length)
    expect(roadmap.summary.totalFamilies).toBe(roadmap.data.families.length)
    expect(
      roadmap.summary.phase1Scenarios + roadmap.summary.phase2Scenarios + roadmap.summary.phase3Scenarios,
    ).toBe(roadmap.summary.totalScenarios)
    expect(
      roadmap.summary.phase1Families + roadmap.summary.phase2Families + roadmap.summary.phase3Families,
    ).toBe(roadmap.summary.totalFamilies)
  })

  it("firstFamily and firstScenario are first entries after roadmap ordering", () => {
    const prioritization = buildPrioritization({
      catalog: [baseEntry({ key: "budget_sparse_rows", sourceType: "excel", tags: ["sparse-layout"] })],
      familyKeys: ALL_FAMILY_KEYS,
    })

    const roadmap = buildHardeningRoadmap(prioritization)
    expect(roadmap.summary.firstScenario).toBe(roadmap.data.scenarios[0]?.scenarioKey ?? null)
    expect(roadmap.summary.firstFamily).toBe(roadmap.data.families[0]?.familyKey ?? null)
  })

  it("emits warnings on empty prioritization input", () => {
    const empty = buildHardeningRoadmap({
      data: { scenarioPriorities: [], familyPriorities: [] },
      summary: {
        totalScenarios: 0,
        highPriorityCount: 0,
        mediumPriorityCount: 0,
        lowPriorityCount: 0,
        topScenario: null,
        topFamily: null,
      },
      warnings: [],
    })
    expect(empty.warnings.some((w) => w.code === "EMPTY_ROADMAP_SCENARIOS")).toBe(true)
    expect(empty.warnings.some((w) => w.code === "EMPTY_ROADMAP_FAMILIES")).toBe(true)
  })

  it("counts phases correctly on roadmap output", () => {
    const prioritization = buildPrioritization({
      catalog: [baseEntry()],
      familyKeys: ALL_FAMILY_KEYS,
    })
    const roadmap = buildHardeningRoadmap(prioritization)
    expect(roadmap.summary.phase1Scenarios).toBe(
      roadmap.data.scenarios.filter((s) => s.phase === 1).length,
    )
    expect(roadmap.summary.phase1Families).toBe(
      roadmap.data.families.filter((f) => f.phase === 1).length,
    )
  })

  it("is identical for repeated calls with the same prioritization (no randomness)", () => {
    const prioritization = buildPrioritization({
      catalog: [
        baseEntry({ key: "soa_simple_happy_path", sourceType: "excel", documentKind: "soa", tags: [] }),
        baseEntry(),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    })
    expect(buildHardeningRoadmap(prioritization)).toEqual(buildHardeningRoadmap(prioritization))
  })

  it("does not mutate prioritization scenario reasons", () => {
    const prioritization = buildPrioritization({
      catalog: [
        baseEntry({
          key: "budget_duplicate_headers",
          sourceType: "excel",
          tags: ["edge-case"],
          documentKind: "sponsor_budget",
        }),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    })
    const before = prioritization.data.scenarioPriorities.map((s) => s.reasons.slice())

    buildHardeningRoadmap(prioritization)

    prioritization.data.scenarioPriorities.forEach((s, i) => {
      expect(s.reasons).toEqual(before[i])
    })
  })
})
