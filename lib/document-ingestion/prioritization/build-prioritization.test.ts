import { describe, expect, it } from "vitest"

import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"
import { buildPrioritization } from "./build-prioritization"

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

describe("buildPrioritization", () => {
  it("returns result shape matching PrioritizationResult contract", () => {
    const result = buildPrioritization({
      catalog: [baseEntry({ key: "visit_schedule_basic" })],
      familyKeys: ALL_FAMILY_KEYS,
    })

    expect(result.data).toHaveProperty("scenarioPriorities")
    expect(result.data).toHaveProperty("familyPriorities")
    expect(Array.isArray(result.data.scenarioPriorities)).toBe(true)
    expect(Array.isArray(result.data.familyPriorities)).toBe(true)
    expect(result.summary).toMatchObject({
      totalScenarios: expect.any(Number),
      highPriorityCount: expect.any(Number),
      mediumPriorityCount: expect.any(Number),
      lowPriorityCount: expect.any(Number),
      topScenario: expect.anything(),
      topFamily: expect.anything(),
    })
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it("sorts scenario priorities by score desc then scenarioKey asc", () => {
    const result = buildPrioritization({
      catalog: [
        baseEntry({
          key: "soa_simple_happy_path",
          sourceType: "excel",
          documentKind: "soa",
          tags: [],
        }),
        baseEntry({
          key: "budget_simple_happy_path",
          sourceType: "excel",
          documentKind: "unknown",
          tags: [],
        }),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    })

    const keys = result.data.scenarioPriorities.map((p) => p.scenarioKey)
    expect(keys).toEqual(["soa_simple_happy_path", "budget_simple_happy_path"])
    const scores = result.data.scenarioPriorities.map((p) => p.score)
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]!)
  })

  it("sorts family priorities by score desc then familyKey asc", () => {
    const result = buildPrioritization({
      catalog: [
        baseEntry({
          key: "budget_simple_happy_path",
          sourceType: "excel",
          documentKind: "sponsor_budget",
          tags: ["edge-case"],
        }),
        baseEntry({
          key: "soa_simple_happy_path",
          sourceType: "excel",
          documentKind: "soa",
          tags: [],
        }),
      ],
      familyKeys: [...ALL_FAMILY_KEYS].sort((a, b) => b.localeCompare(a)),
    })

    const families = result.data.familyPriorities
    for (let i = 1; i < families.length; i++) {
      const prev = families[i - 1]!
      const cur = families[i]!
      expect(prev.score >= cur.score).toBe(true)
      if (prev.score === cur.score) {
        expect(prev.familyKey.localeCompare(cur.familyKey)).toBeLessThanOrEqual(0)
      }
    }
  })

  it("summary counts match scenario priority buckets", () => {
    const result = buildPrioritization({
      catalog: [
        baseEntry({
          key: "budget_simple_happy_path",
          sourceType: "excel",
          tags: ["edge-case", "multi-table"],
          documentKind: "unknown",
        }),
        baseEntry({
          key: "soa_simple_happy_path",
          sourceType: "pdf",
          tags: [],
          documentKind: "unknown",
        }),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    })

    const { summary, data } = result
    expect(summary.totalScenarios).toBe(data.scenarioPriorities.length)
    expect(
      summary.highPriorityCount + summary.mediumPriorityCount + summary.lowPriorityCount,
    ).toBe(summary.totalScenarios)
  })

  it("emits warnings on empty scenario and family inputs", () => {
    const emptyScenarios = buildPrioritization({
      catalog: [],
      familyKeys: ALL_FAMILY_KEYS,
    })
    expect(emptyScenarios.warnings.some((w) => w.code === "EMPTY_SCENARIO_PRIORITIES")).toBe(true)
    expect(emptyScenarios.summary.topScenario).toBeNull()

    const emptyFamilies = buildPrioritization({
      catalog: [baseEntry()],
      familyKeys: [],
    })
    expect(emptyFamilies.warnings.some((w) => w.code === "EMPTY_FAMILY_PRIORITIES")).toBe(true)
    expect(emptyFamilies.summary.topFamily).toBeNull()
  })

  it("topScenario and topFamily match first sorted entries", () => {
    const result = buildPrioritization({
      catalog: [
        baseEntry({
          key: "budget_duplicate_headers",
          sourceType: "excel",
          tags: ["duplicate-headers", "edge-case"],
          documentKind: "sponsor_budget",
        }),
        baseEntry({
          key: "budget_simple_happy_path",
          sourceType: "excel",
          documentKind: "unknown",
          tags: [],
        }),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    })

    expect(result.summary.topScenario).toBe(result.data.scenarioPriorities[0]?.scenarioKey ?? null)
    expect(result.summary.topFamily).toBe(result.data.familyPriorities[0]?.familyKey ?? null)
  })

  it("does not mutate the input catalog array or entries", () => {
    const catalog = [
      baseEntry({
        key: "budget_simple_happy_path",
        tags: ["budget"],
        sourceType: "excel",
        documentKind: "sponsor_budget",
      }),
    ]
    const before = structuredClone(catalog)

    buildPrioritization({ catalog, familyKeys: ALL_FAMILY_KEYS })

    expect(catalog).toEqual(before)
  })

  it("produces identical output for repeated calls with the same args", () => {
    const args = {
      catalog: [
        baseEntry({
          key: "budget_multi_sheet_detection",
          sourceType: "excel",
          tags: ["multi-sheet", "budget"],
          documentKind: "sponsor_budget",
        }),
      ],
      familyKeys: ALL_FAMILY_KEYS,
    }

    const a = buildPrioritization(args)
    const b = buildPrioritization(args)
    expect(a).toEqual(b)
  })
})
