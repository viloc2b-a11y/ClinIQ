import { describe, expect, it } from "vitest"

import type { ScenarioBlueprint } from "../scenario-blueprints/types"
import { buildScenarioDraft } from "./build-scenario-draft"

describe("buildScenarioDraft", () => {
  const blueprint: ScenarioBlueprint = {
    code: "BLUEPRINT_PLAN_A_1",
    order: 3,
    sourcePlanItemCode: "PLAN_A",
    familyKey: "sheet_selection",
    proposedScenarioKey: "scenario_tag_ambiguous_1",
    targetTags: ["ambiguous"],
    structureIntent: "edge_case_expansion",
    rationale: ["x"],
  }

  it("matches ScenarioDraft contract fields", () => {
    const draft = buildScenarioDraft(blueprint)
    expect(draft.code).toBe("DRAFT_BLUEPRINT_PLAN_A_1")
    expect(draft.sourceBlueprintCode).toBe("BLUEPRINT_PLAN_A_1")
    expect(draft.proposedScenarioKey).toBe("scenario_tag_ambiguous_1")
    expect(draft.familyKey).toBe("sheet_selection")
    expect(draft.status).toBe("draft_pending_definition")
    expect(draft.structureIntent).toBe("edge_case_expansion")
    expect(draft.metadata.title).toBeTruthy()
    expect(draft.metadata.description).toContain("Placeholder scenario draft")
    expect(draft.metadata.description).toContain("edge_case_expansion")
    expect(draft.metadata.description).toContain("BLUEPRINT_PLAN_A_1")
  })

  it("rationale includes expected markers", () => {
    const draft = buildScenarioDraft(blueprint)
    expect(draft.rationale).toContain("draft_generated_from_blueprint")
    expect(draft.rationale).toContain("source_blueprint:BLUEPRINT_PLAN_A_1")
    expect(draft.rationale).toContain("structure_intent:edge_case_expansion")
  })

  it("copies targetTags without mutating blueprint", () => {
    const tags = ["a", "b"]
    const bp = { ...blueprint, targetTags: tags }
    const draft = buildScenarioDraft(bp)
    draft.targetTags.push("c")
    expect(bp.targetTags).toEqual(["a", "b"])
  })
})
