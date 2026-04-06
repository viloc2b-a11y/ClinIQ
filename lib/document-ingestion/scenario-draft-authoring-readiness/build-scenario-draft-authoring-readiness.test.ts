import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringCoverageResult } from "../scenario-draft-authoring-coverage/types"
import { buildScenarioDraftAuthoringReadiness } from "./build-scenario-draft-authoring-readiness"

function goodCoverage(): ScenarioDraftAuthoringCoverageResult {
  return {
    data: {
      worksets: [
        {
          worksetCode: "AUTHORING_WORKSET_0001",
          worksetPosition: 1,
          totalItems: 2,
          familyKeys: ["happy_path"],
          structureIntents: ["edge_case_expansion"],
          firstQueueItemCode: "G1",
          lastQueueItemCode: "G2",
        },
      ],
      families: [
        { familyKey: "happy_path", totalItems: 2, worksetCount: 1, firstWorksetCode: "AUTHORING_WORKSET_0001" },
      ],
      structureIntents: [
        {
          structureIntent: "edge_case_expansion",
          totalItems: 2,
          worksetCount: 1,
          firstWorksetCode: "AUTHORING_WORKSET_0001",
        },
      ],
    },
    summary: {
      totalWorksets: 1,
      totalScheduledItems: 2,
      representedFamilyCount: 1,
      representedStructureIntentCount: 1,
      nullFamilyRepresented: false,
      firstWorksetCode: "AUTHORING_WORKSET_0001",
      firstFamilyKey: "happy_path",
      firstStructureIntent: "edge_case_expansion",
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringReadiness", () => {
  it("matches contract and copies summary for ready state", () => {
    const c = goodCoverage()
    const result = buildScenarioDraftAuthoringReadiness(c)
    expect(result.data.readiness.status).toBe("ready")
    expect(result.summary.status).toBe("ready")
    expect(result.summary.totalWorksets).toBe(1)
    expect(result.summary.totalScheduledItems).toBe(2)
    expect(result.summary.representedFamilyCount).toBe(1)
    expect(result.summary.representedStructureIntentCount).toBe(1)
    expect(result.summary.nullFamilyRepresented).toBe(false)
    expect(result.warnings).toHaveLength(0)
  })

  it("emits AUTHORING_NOT_READY when not_ready", () => {
    const c: ScenarioDraftAuthoringCoverageResult = {
      data: { worksets: [], families: [], structureIntents: [] },
      summary: {
        totalWorksets: 0,
        totalScheduledItems: 0,
        representedFamilyCount: 0,
        representedStructureIntentCount: 0,
        nullFamilyRepresented: false,
        firstWorksetCode: null,
        firstFamilyKey: null,
        firstStructureIntent: null,
      },
      warnings: [],
    }
    const result = buildScenarioDraftAuthoringReadiness(c)
    expect(result.data.readiness.status).toBe("not_ready")
    expect(result.warnings.some((w) => w.code === "AUTHORING_NOT_READY")).toBe(true)
  })

  it("emits AUTHORING_READY_WITH_WARNINGS when ready_with_warnings", () => {
    const c = goodCoverage()
    c.summary.nullFamilyRepresented = true
    c.data.families.push({
      familyKey: null,
      totalItems: 1,
      worksetCount: 1,
      firstWorksetCode: "AUTHORING_WORKSET_0001",
    })
    c.summary.representedFamilyCount = 2
    const result = buildScenarioDraftAuthoringReadiness(c)
    expect(result.data.readiness.status).toBe("ready_with_warnings")
    expect(result.warnings.some((w) => w.code === "AUTHORING_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate coverage input", () => {
    const c = goodCoverage()
    const snap = structuredClone(c)
    buildScenarioDraftAuthoringReadiness(c)
    expect(c).toEqual(snap)
  })

  it("is deterministic", () => {
    const c = goodCoverage()
    expect(buildScenarioDraftAuthoringReadiness(c)).toEqual(buildScenarioDraftAuthoringReadiness(c))
  })
})
