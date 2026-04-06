import { describe, expect, it } from "vitest"

import type { ScenarioBlueprintResult } from "../scenario-blueprints/types"
import { buildScenarioDrafts } from "./build-scenario-drafts"

function emptyBlueprints(): ScenarioBlueprintResult {
  return {
    data: { blueprints: [] },
    summary: {
      totalBlueprints: 0,
      edgeCaseExpansionCount: 0,
      familyDepthExpansionCount: 0,
      distributionRebalanceCount: 0,
      firstBlueprintCode: null,
    },
    warnings: [],
  }
}

describe("buildScenarioDrafts", () => {
  it("matches ScenarioDraftResult contract with sequential order", () => {
    const blueprintResult: ScenarioBlueprintResult = {
      data: {
        blueprints: [
          {
            code: "B2",
            order: 2,
            sourcePlanItemCode: "P",
            familyKey: "happy_path",
            proposedScenarioKey: "scenario_z_1",
            targetTags: ["t"],
            structureIntent: "edge_case_expansion",
            rationale: [],
          },
          {
            code: "B1",
            order: 1,
            sourcePlanItemCode: "P",
            familyKey: null,
            proposedScenarioKey: "scenario_a_1",
            targetTags: ["t"],
            structureIntent: "family_depth_expansion",
            rationale: [],
          },
        ],
      },
      summary: {
        totalBlueprints: 2,
        edgeCaseExpansionCount: 1,
        familyDepthExpansionCount: 1,
        distributionRebalanceCount: 0,
        firstBlueprintCode: null,
      },
      warnings: [],
    }

    const result = buildScenarioDrafts(blueprintResult)
    expect(result.data.drafts).toHaveLength(2)
    expect(result.data.drafts.map((d) => d.order)).toEqual([1, 2])
    expect(result.data.drafts[0]?.proposedScenarioKey).toBe("scenario_a_1")
    expect(result.summary.totalDrafts).toBe(2)
    expect(result.summary.nullFamilyCount).toBe(1)
    expect(result.summary.firstDraftCode).toBe(result.data.drafts[0]?.code ?? null)
    expect(
      result.summary.edgeCaseExpansionCount +
        result.summary.familyDepthExpansionCount +
        result.summary.distributionRebalanceCount,
    ).toBe(2)
  })

  it("warns on empty blueprint input", () => {
    const result = buildScenarioDrafts(emptyBlueprints())
    expect(result.warnings.some((w) => w.code === "NO_DRAFTS")).toBe(true)
    expect(result.data.drafts).toHaveLength(0)
  })

  it("warns when any draft has null family", () => {
    const blueprintResult: ScenarioBlueprintResult = {
      data: {
        blueprints: [
          {
            code: "BX",
            order: 1,
            sourcePlanItemCode: "P",
            familyKey: null,
            proposedScenarioKey: "scenario_x_1",
            targetTags: [],
            structureIntent: "distribution_rebalance",
            rationale: [],
          },
        ],
      },
      summary: {
        totalBlueprints: 1,
        edgeCaseExpansionCount: 0,
        familyDepthExpansionCount: 0,
        distributionRebalanceCount: 1,
        firstBlueprintCode: null,
      },
      warnings: [],
    }
    const result = buildScenarioDrafts(blueprintResult)
    expect(result.warnings.some((w) => w.code === "DRAFTS_WITH_NULL_FAMILY")).toBe(true)
  })

  it("does not mutate blueprint result", () => {
    const blueprintResult: ScenarioBlueprintResult = {
      data: {
        blueprints: [
          {
            code: "BY",
            order: 1,
            sourcePlanItemCode: "P",
            familyKey: "visit_schedule",
            proposedScenarioKey: "scenario_y_1",
            targetTags: ["distribution-rebalance"],
            structureIntent: "distribution_rebalance",
            rationale: [],
          },
        ],
      },
      summary: {
        totalBlueprints: 1,
        edgeCaseExpansionCount: 0,
        familyDepthExpansionCount: 0,
        distributionRebalanceCount: 1,
        firstBlueprintCode: null,
      },
      warnings: [],
    }
    const snap = structuredClone(blueprintResult)
    buildScenarioDrafts(blueprintResult)
    expect(blueprintResult).toEqual(snap)
  })

  it("is deterministic", () => {
    const blueprintResult: ScenarioBlueprintResult = {
      data: {
        blueprints: [
          {
            code: "B1",
            order: 1,
            sourcePlanItemCode: "P",
            familyKey: "boundary_detection",
            proposedScenarioKey: "scenario_boundary_expansion_1",
            targetTags: ["family-expansion"],
            structureIntent: "family_depth_expansion",
            rationale: [],
          },
        ],
      },
      summary: {
        totalBlueprints: 1,
        edgeCaseExpansionCount: 0,
        familyDepthExpansionCount: 1,
        distributionRebalanceCount: 0,
        firstBlueprintCode: null,
      },
      warnings: [],
    }
    expect(buildScenarioDrafts(blueprintResult)).toEqual(buildScenarioDrafts(blueprintResult))
  })
})
