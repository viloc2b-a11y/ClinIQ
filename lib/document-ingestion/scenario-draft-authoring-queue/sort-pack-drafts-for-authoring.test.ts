import { describe, expect, it } from "vitest"

import type { ScenarioDraft } from "../scenario-drafts/types"
import { sortPackDraftsForAuthoring } from "./sort-pack-drafts-for-authoring"

function d(overrides: Partial<ScenarioDraft>): ScenarioDraft {
  return {
    code: "DRAFT_1",
    order: 1,
    sourceBlueprintCode: "B",
    proposedScenarioKey: "scenario_m_1",
    familyKey: "happy_path",
    targetTags: [],
    structureIntent: "edge_case_expansion",
    status: "draft_pending_definition",
    metadata: { title: "T", description: "D" },
    placeholderStructureNotes: [],
    rationale: [],
    ...overrides,
  }
}

describe("sortPackDraftsForAuthoring", () => {
  it("sorts by order asc", () => {
    const sorted = sortPackDraftsForAuthoring([
      d({ code: "B", order: 2 }),
      d({ code: "A", order: 1 }),
    ])
    expect(sorted.map((x) => x.code)).toEqual(["A", "B"])
  })

  it("ties on order with proposedScenarioKey asc", () => {
    const sorted = sortPackDraftsForAuthoring([
      d({ code: "B", order: 1, proposedScenarioKey: "scenario_z" }),
      d({ code: "A", order: 1, proposedScenarioKey: "scenario_a" }),
    ])
    expect(sorted.map((x) => x.code)).toEqual(["A", "B"])
  })

  it("ties on order and key with code asc", () => {
    const sorted = sortPackDraftsForAuthoring([
      d({ code: "DRAFT_B", order: 1, proposedScenarioKey: "scenario_x_1" }),
      d({ code: "DRAFT_A", order: 1, proposedScenarioKey: "scenario_x_1" }),
    ])
    expect(sorted.map((x) => x.code)).toEqual(["DRAFT_A", "DRAFT_B"])
  })

  it("does not mutate input", () => {
    const drafts = [d({ code: "X" })]
    const snap = structuredClone(drafts)
    sortPackDraftsForAuthoring(drafts)
    expect(drafts).toEqual(snap)
  })
})
