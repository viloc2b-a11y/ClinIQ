import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringCoverageResult } from "../scenario-draft-authoring-coverage/types"
import { evaluateAuthoringReadiness } from "./evaluate-authoring-readiness"

function ws(totalItems: number): ScenarioDraftAuthoringCoverageResult["data"]["worksets"][number] {
  return {
    worksetCode: "W",
    worksetPosition: 1,
    totalItems,
    familyKeys: ["happy_path"],
    structureIntents: ["edge_case_expansion"],
    firstQueueItemCode: "G",
    lastQueueItemCode: "G",
  }
}

function coverage(
  overrides: {
    summary?: Partial<ScenarioDraftAuthoringCoverageResult["summary"]>
    data?: Partial<ScenarioDraftAuthoringCoverageResult["data"]>
    warnings?: ScenarioDraftAuthoringCoverageResult["warnings"]
  } = {},
): ScenarioDraftAuthoringCoverageResult {
  const base: ScenarioDraftAuthoringCoverageResult = {
    data: {
      worksets: [ws(1)],
      families: [{ familyKey: "happy_path", totalItems: 1, worksetCount: 1, firstWorksetCode: "W" }],
      structureIntents: [
        {
          structureIntent: "edge_case_expansion",
          totalItems: 1,
          worksetCount: 1,
          firstWorksetCode: "W",
        },
      ],
    },
    summary: {
      totalWorksets: 1,
      totalScheduledItems: 1,
      representedFamilyCount: 1,
      representedStructureIntentCount: 1,
      nullFamilyRepresented: false,
      firstWorksetCode: "W",
      firstFamilyKey: "happy_path",
      firstStructureIntent: "edge_case_expansion",
    },
    warnings: [],
  }
  return {
    ...base,
    data: { ...base.data, ...overrides.data },
    summary: { ...base.summary, ...overrides.summary },
    warnings: overrides.warnings ?? base.warnings,
  }
}

describe("evaluateAuthoringReadiness", () => {
  it("returns ready when structural checks pass and no null family", () => {
    const r = evaluateAuthoringReadiness(coverage())
    expect(r.status).toBe("ready")
    expect(r.checks.hasNullFamilyRepresentation).toBe(false)
    expect(r.reasons).toEqual([])
  })

  it("returns ready_with_warnings when structurally ready but null family represented", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        summary: { nullFamilyRepresented: true },
        data: {
          families: [
            { familyKey: "happy_path", totalItems: 1, worksetCount: 1, firstWorksetCode: "W" },
            { familyKey: null, totalItems: 1, worksetCount: 1, firstWorksetCode: "W" },
          ],
        },
      }),
    )
    expect(r.status).toBe("ready_with_warnings")
    expect(r.reasons).toContain(
      "Some scheduled scenario drafts do not have a family assignment.",
    )
  })

  it("returns not_ready when no worksets", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        data: { worksets: [], families: [], structureIntents: [] },
        summary: {
          totalWorksets: 0,
          totalScheduledItems: 0,
          representedFamilyCount: 0,
          representedStructureIntentCount: 0,
        },
      }),
    )
    expect(r.status).toBe("not_ready")
    expect(r.reasons[0]).toBe("No authoring worksets are available.")
  })

  it("returns not_ready when a workset is empty", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        data: {
          worksets: [ws(0), ws(1)],
          families: [],
          structureIntents: [],
        },
        summary: {
          totalWorksets: 2,
          totalScheduledItems: 1,
          representedFamilyCount: 0,
          representedStructureIntentCount: 0,
        },
      }),
    )
    expect(r.status).toBe("not_ready")
    expect(r.reasons).toContain("One or more authoring worksets are empty.")
  })

  it("returns not_ready when no scheduled items", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        summary: { totalScheduledItems: 0 },
      }),
    )
    expect(r.status).toBe("not_ready")
    expect(r.reasons).toContain("No scenario drafts are scheduled for authoring.")
  })

  it("returns not_ready when no families represented", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        data: { families: [] },
        summary: { representedFamilyCount: 0 },
      }),
    )
    expect(r.status).toBe("not_ready")
    expect(r.reasons).toContain("No scenario families are represented in authoring coverage.")
  })

  it("returns not_ready when no structure intents represented", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        data: { structureIntents: [] },
        summary: { representedStructureIntentCount: 0 },
      }),
    )
    expect(r.status).toBe("not_ready")
    expect(r.reasons).toContain("No structure intents are represented in authoring coverage.")
  })

  it("lists reasons in deterministic order for multiple failures", () => {
    const r = evaluateAuthoringReadiness(
      coverage({
        data: { worksets: [], families: [], structureIntents: [] },
        summary: {
          totalWorksets: 0,
          totalScheduledItems: 0,
          representedFamilyCount: 0,
          representedStructureIntentCount: 0,
        },
      }),
    )
    expect(r.reasons).toEqual([
      "No authoring worksets are available.",
      "No scenario drafts are scheduled for authoring.",
      "No scenario families are represented in authoring coverage.",
      "No structure intents are represented in authoring coverage.",
    ])
  })

  it("does not mutate coverage result", () => {
    const c = coverage()
    const snap = structuredClone(c)
    evaluateAuthoringReadiness(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = coverage()
    expect(evaluateAuthoringReadiness(c)).toEqual(evaluateAuthoringReadiness(c))
  })
})
