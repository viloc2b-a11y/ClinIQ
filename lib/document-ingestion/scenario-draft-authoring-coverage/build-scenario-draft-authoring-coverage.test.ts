import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringWorksetResult } from "../scenario-draft-authoring-worksets/types"
import { buildScenarioDraftAuthoringCoverage } from "./build-scenario-draft-authoring-coverage"

function item(
  familyKey: "visit_schedule" | null,
  intent: "edge_case_expansion" | "family_depth_expansion",
) {
  return {
    queuePosition: 1,
    globalQueueCode: "GQ",
    reviewPackCode: "RP",
    reviewPackPosition: 1,
    reviewPackDraftPosition: 1,
    familyKey,
    structureIntent: intent,
    draft: {
      code: "DC",
      order: 1,
      sourceBlueprintCode: "B",
      proposedScenarioKey: "s",
      familyKey,
      targetTags: [] as string[],
      structureIntent: intent,
      status: "draft_pending_definition" as const,
      metadata: { title: "T", description: "D" },
      placeholderStructureNotes: [] as string[],
      rationale: [] as string[],
    },
  }
}

function emptyWorksetResult(): ScenarioDraftAuthoringWorksetResult {
  return {
    data: { worksets: [] },
    summary: {
      totalWorksets: 0,
      totalQueueItems: 0,
      configuredWorksetSize: 5,
      firstWorksetCode: null,
      lastWorksetCode: null,
      worksetsWithNullFamilyItems: 0,
      maxWorksetSizeObserved: 0,
      minWorksetSizeObserved: 0,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringCoverage", () => {
  it("builds workset family and intent coverage with summary", () => {
    const worksetResult: ScenarioDraftAuthoringWorksetResult = {
      data: {
        worksets: [
          {
            worksetCode: "AUTHORING_WORKSET_0001",
            worksetPosition: 1,
            startQueuePosition: 1,
            endQueuePosition: 1,
            items: [item("visit_schedule", "edge_case_expansion")],
            summary: {
              totalItems: 1,
              firstQueueItemCode: "GQ",
              lastQueueItemCode: "GQ",
              uniqueReviewPackCount: 1,
              nullFamilyItemCount: 0,
            },
          },
        ],
      },
      summary: {
        totalWorksets: 1,
        totalQueueItems: 1,
        configuredWorksetSize: 5,
        firstWorksetCode: "AUTHORING_WORKSET_0001",
        lastWorksetCode: "AUTHORING_WORKSET_0001",
        worksetsWithNullFamilyItems: 0,
        maxWorksetSizeObserved: 1,
        minWorksetSizeObserved: 1,
      },
      warnings: [],
    }

    const result = buildScenarioDraftAuthoringCoverage(worksetResult)
    expect(result.data.worksets).toHaveLength(1)
    expect(result.data.families).toHaveLength(1)
    expect(result.data.structureIntents).toHaveLength(1)
    expect(result.summary.totalScheduledItems).toBe(1)
    expect(result.summary.representedFamilyCount).toBe(1)
    expect(result.summary.representedStructureIntentCount).toBe(1)
    expect(result.summary.nullFamilyRepresented).toBe(false)
    expect(result.summary.firstWorksetCode).toBe("AUTHORING_WORKSET_0001")
    expect(result.summary.firstFamilyKey).toBe("visit_schedule")
    expect(result.summary.firstStructureIntent).toBe("edge_case_expansion")
  })

  it("warns on empty worksets", () => {
    const result = buildScenarioDraftAuthoringCoverage(emptyWorksetResult())
    expect(result.warnings.some((w) => w.code === "NO_AUTHORING_COVERAGE")).toBe(true)
  })

  it("warns when null family represented", () => {
    const worksetResult: ScenarioDraftAuthoringWorksetResult = {
      data: {
        worksets: [
          {
            worksetCode: "W1",
            worksetPosition: 1,
            startQueuePosition: 1,
            endQueuePosition: 1,
            items: [item(null, "family_depth_expansion")],
            summary: {
              totalItems: 1,
              firstQueueItemCode: "G",
              lastQueueItemCode: "G",
              uniqueReviewPackCount: 1,
              nullFamilyItemCount: 1,
            },
          },
        ],
      },
      summary: {
        totalWorksets: 1,
        totalQueueItems: 1,
        configuredWorksetSize: 5,
        firstWorksetCode: "W1",
        lastWorksetCode: "W1",
        worksetsWithNullFamilyItems: 1,
        maxWorksetSizeObserved: 1,
        minWorksetSizeObserved: 1,
      },
      warnings: [],
    }
    const result = buildScenarioDraftAuthoringCoverage(worksetResult)
    expect(
      result.warnings.some((w) => w.code === "NULL_FAMILY_REPRESENTED_IN_AUTHORING_COVERAGE"),
    ).toBe(true)
    expect(result.summary.nullFamilyRepresented).toBe(true)
  })

  it("does not mutate workset result", () => {
    const worksetResult: ScenarioDraftAuthoringWorksetResult = {
      data: {
        worksets: [
          {
            worksetCode: "WX",
            worksetPosition: 1,
            startQueuePosition: 1,
            endQueuePosition: 1,
            items: [item("visit_schedule", "edge_case_expansion")],
            summary: {
              totalItems: 1,
              firstQueueItemCode: "G",
              lastQueueItemCode: "G",
              uniqueReviewPackCount: 1,
              nullFamilyItemCount: 0,
            },
          },
        ],
      },
      summary: {
        totalWorksets: 1,
        totalQueueItems: 1,
        configuredWorksetSize: 5,
        firstWorksetCode: "WX",
        lastWorksetCode: "WX",
        worksetsWithNullFamilyItems: 0,
        maxWorksetSizeObserved: 1,
        minWorksetSizeObserved: 1,
      },
      warnings: [],
    }
    const snap = structuredClone(worksetResult)
    buildScenarioDraftAuthoringCoverage(worksetResult)
    expect(worksetResult).toEqual(snap)
  })

  it("is deterministic", () => {
    const worksetResult: ScenarioDraftAuthoringWorksetResult = {
      data: {
        worksets: [
          {
            worksetCode: "WY",
            worksetPosition: 1,
            startQueuePosition: 1,
            endQueuePosition: 1,
            items: [item("visit_schedule", "edge_case_expansion")],
            summary: {
              totalItems: 1,
              firstQueueItemCode: "G",
              lastQueueItemCode: "G",
              uniqueReviewPackCount: 1,
              nullFamilyItemCount: 0,
            },
          },
        ],
      },
      summary: {
        totalWorksets: 1,
        totalQueueItems: 1,
        configuredWorksetSize: 5,
        firstWorksetCode: "WY",
        lastWorksetCode: "WY",
        worksetsWithNullFamilyItems: 0,
        maxWorksetSizeObserved: 1,
        minWorksetSizeObserved: 1,
      },
      warnings: [],
    }
    expect(buildScenarioDraftAuthoringCoverage(worksetResult)).toEqual(
      buildScenarioDraftAuthoringCoverage(worksetResult),
    )
  })
})
