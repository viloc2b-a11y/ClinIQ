import { describe, expect, it } from "vitest"

import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import { scoreScenarioPriority } from "./score-scenario-priority"

function baseEntry(overrides: Partial<ScenarioCatalogEntry>): ScenarioCatalogEntry {
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

describe("scoreScenarioPriority", () => {
  it("excel plus edge-case plus multi-table yields high priority", () => {
    const entry = baseEntry({
      sourceType: "excel",
      tags: ["edge-case", "multi-table"],
      documentKind: "unknown",
    })

    const a = scoreScenarioPriority(entry)
    expect(a.score).toBe(8)
    expect(a.priority).toBe("high")
    expect(a.reasons).toEqual(["excel_source", "edge_case", "multi_table"])
  })

  it("simple non-edge scenario yields low priority deterministically", () => {
    const entry = baseEntry({
      sourceType: "pdf",
      tags: [],
      documentKind: "unknown",
    })

    const a = scoreScenarioPriority(entry)
    expect(a.score).toBe(0)
    expect(a.priority).toBe("low")
    expect(a.reasons).toEqual([])
  })

  it("excel plus sponsor_budget yields medium priority deterministically", () => {
    const entry = baseEntry({
      sourceType: "excel",
      tags: ["budget"],
      documentKind: "sponsor_budget",
    })

    const a = scoreScenarioPriority(entry)
    expect(a.score).toBe(5)
    expect(a.priority).toBe("medium")
    expect(a.reasons).toContain("excel_source")
    expect(a.reasons).toContain("budget_kind")
  })

  it("score reasons are stable and reflect tag order of evaluation", () => {
    const entry = baseEntry({
      sourceType: "excel",
      tags: ["sparse-layout", "messy-headers", "edge-case"],
      documentKind: "unknown",
    })

    const a = scoreScenarioPriority(entry)
    expect(a.reasons).toEqual([
      "excel_source",
      "edge_case",
      "messy_headers",
      "sparse_layout",
    ])
    expect(a.score).toBe(3 + 3 + 2 + 1)
  })

  it("same input always produces same score priority and reasons", () => {
    const entry = baseEntry({
      sourceType: "excel",
      tags: ["multi-sheet", "fragmented"],
      documentKind: "soa",
    })

    const first = scoreScenarioPriority(entry)
    const second = scoreScenarioPriority(entry)
    expect(first).toEqual(second)
  })
})
