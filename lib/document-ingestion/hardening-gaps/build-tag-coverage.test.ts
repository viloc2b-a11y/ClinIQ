import { describe, expect, it } from "vitest"

import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { ScenarioPriority } from "../prioritization/types"
import { EXPECTED_COVERAGE_TAGS } from "./expected-coverage-tags"
import { buildTagCoverage } from "./build-tag-coverage"

function entry(
  key: ScenarioCatalogEntry["key"],
  tags: string[],
  overrides: Partial<ScenarioCatalogEntry> = {},
): ScenarioCatalogEntry {
  return {
    key,
    label: "L",
    description: "D",
    fixtureType: "x",
    tags,
    fileName: null,
    sourceType: "excel",
    route: "unknown",
    status: "ready",
    outputsReady: true,
    artifactsReady: 0,
    totalWarnings: 0,
    documentKind: "unknown",
    ...overrides,
  }
}

function sp(
  scenarioKey: ScenarioPriority["scenarioKey"],
  familyKey: ScenarioPriority["familyKey"],
  score: number,
): ScenarioPriority {
  return {
    scenarioKey,
    familyKey,
    score,
    priority: score >= 8 ? "high" : "low",
    reasons: [],
  }
}

describe("buildTagCoverage", () => {
  it("includes every expected tag even when count is 0", () => {
    const rows = buildTagCoverage({ catalog: [], scenarioPriorities: [] })
    expect(rows).toHaveLength(EXPECTED_COVERAGE_TAGS.length)
    const tags = new Set(rows.map((r) => r.tag))
    for (const t of EXPECTED_COVERAGE_TAGS) {
      expect(tags.has(t)).toBe(true)
    }
    expect(rows.every((r) => r.coverageLevel === "missing")).toBe(true)
  })

  it("classifies missing weak medium strong from counts", () => {
    const catalog: ScenarioCatalogEntry[] = [
      entry("budget_sparse_rows", ["sparse-layout"]),
      entry("budget_sectioned_layout", ["sparse-layout", "edge-case"]),
      entry("budget_simple_happy_path", ["sparse-layout"]),
      entry("soa_simple_happy_path", ["sparse-layout"]),
    ]
    const priorities: ScenarioPriority[] = [
      sp("budget_sparse_rows", "row_structure", 3),
      sp("budget_sectioned_layout", "row_structure", 3),
      sp("budget_simple_happy_path", "happy_path", 3),
      sp("soa_simple_happy_path", "happy_path", 3),
    ]
    const rows = buildTagCoverage({ catalog, scenarioPriorities: priorities })
    const sparse = rows.find((r) => r.tag === "sparse-layout")
    expect(sparse?.coverageLevel).toBe("strong")
    expect(sparse?.count).toBe(4)

    const single = rows.find((r) => r.tag === "edge-case")
    expect(single?.coverageLevel).toBe("weak")
    expect(single?.count).toBe(1)
  })

  it("treats counts 2 and 3 as medium", () => {
    const two: ScenarioCatalogEntry[] = [
      entry("budget_multi_sheet_detection", ["multi-sheet"]),
      entry("multi_candidate_sheet_selection", ["multi-sheet"]),
    ]
    const rows2 = buildTagCoverage({
      catalog: two,
      scenarioPriorities: [
        sp("budget_multi_sheet_detection", "sheet_selection", 1),
        sp("multi_candidate_sheet_selection", "sheet_selection", 1),
      ],
    })
    expect(rows2.find((r) => r.tag === "multi-sheet")?.coverageLevel).toBe("medium")

    const three = [
      ...two,
      entry("budget_sparse_rows", ["multi-sheet"]),
    ]
    const rows3 = buildTagCoverage({
      catalog: three,
      scenarioPriorities: [
        sp("budget_multi_sheet_detection", "sheet_selection", 1),
        sp("multi_candidate_sheet_selection", "sheet_selection", 1),
        sp("budget_sparse_rows", "row_structure", 1),
      ],
    })
    expect(rows3.find((r) => r.tag === "multi-sheet")?.coverageLevel).toBe("medium")
  })

  it("deduplicates and sorts families", () => {
    const catalog: ScenarioCatalogEntry[] = [
      entry("budget_sparse_rows", ["blank-rows"]),
      entry("budget_sectioned_layout", ["blank-rows"]),
    ]
    const priorities: ScenarioPriority[] = [
      sp("budget_sparse_rows", "row_structure", 1),
      sp("budget_sectioned_layout", "row_structure", 1),
    ]
    const row = buildTagCoverage({ catalog, scenarioPriorities: priorities }).find(
      (r) => r.tag === "blank-rows",
    )
    expect(row?.families).toEqual(["row_structure"])
  })

  it("sums priorityWeight only for scenarios that carry the tag", () => {
    const catalog: ScenarioCatalogEntry[] = [
      entry("budget_duplicate_headers", ["edge-case", "excel"]),
      entry("budget_simple_happy_path", ["excel"]),
    ]
    const priorities: ScenarioPriority[] = [
      sp("budget_duplicate_headers", "header_variants", 10),
      sp("budget_simple_happy_path", "happy_path", 99),
    ]
    const edge = buildTagCoverage({ catalog, scenarioPriorities: priorities }).find(
      (r) => r.tag === "edge-case",
    )
    expect(edge?.priorityWeight).toBe(10)
  })

  it("does not mutate catalog or scenarioPriorities", () => {
    const catalog = [entry("budget_sparse_rows", ["edge-case"])]
    const scenarioPriorities = [sp("budget_sparse_rows", "row_structure", 5)]
    const cSnap = structuredClone(catalog)
    const pSnap = structuredClone(scenarioPriorities)
    buildTagCoverage({ catalog, scenarioPriorities })
    expect(catalog).toEqual(cSnap)
    expect(scenarioPriorities).toEqual(pSnap)
  })

  it("produces identical output for identical inputs", () => {
    const catalog = [entry("budget_sparse_rows", ["edge-case", "sparse-layout"])]
    const scenarioPriorities = [sp("budget_sparse_rows", "row_structure", 4)]
    const a = buildTagCoverage({ catalog, scenarioPriorities })
    const b = buildTagCoverage({ catalog, scenarioPriorities })
    expect(a).toEqual(b)
  })
})
