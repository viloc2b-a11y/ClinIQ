import { describe, expect, it } from "vitest"

import type { ScenarioBlueprint } from "../scenario-blueprints/types"
import { buildPlaceholderStructureNotes } from "./build-placeholder-structure-notes"

function blueprint(
  overrides: Partial<ScenarioBlueprint> & Pick<ScenarioBlueprint, "structureIntent" | "familyKey">,
): ScenarioBlueprint {
  return {
    code: "B",
    order: 1,
    sourcePlanItemCode: "P",
    proposedScenarioKey: "k",
    targetTags: [],
    rationale: [],
    ...overrides,
  }
}

describe("buildPlaceholderStructureNotes", () => {
  it("always includes baseline notes", () => {
    const notes = buildPlaceholderStructureNotes(
      blueprint({ structureIntent: "edge_case_expansion", familyKey: "happy_path" }),
    )
    expect(notes).toContain("define representative input structure for this draft")
    expect(notes).toContain("document expected parsing difficulty and edge conditions")
    expect(notes).toContain("keep fixture design deterministic and minimal")
  })

  it("adds edge_case_expansion note", () => {
    const notes = buildPlaceholderStructureNotes(
      blueprint({ structureIntent: "edge_case_expansion", familyKey: "happy_path" }),
    )
    expect(notes).toContain("emphasize tag-driven structural variation")
  })

  it("adds family_depth_expansion note", () => {
    const notes = buildPlaceholderStructureNotes(
      blueprint({ structureIntent: "family_depth_expansion", familyKey: "row_structure" }),
    )
    expect(notes).toContain("expand coverage depth within the assigned family")
  })

  it("adds distribution_rebalance note", () => {
    const notes = buildPlaceholderStructureNotes(
      blueprint({ structureIntent: "distribution_rebalance", familyKey: "header_variants" }),
    )
    expect(notes).toContain("improve cross-pattern distribution coverage")
  })

  it("adds family assignment note when familyKey is null", () => {
    const notes = buildPlaceholderStructureNotes(
      blueprint({ structureIntent: "edge_case_expansion", familyKey: null }),
    )
    expect(notes).toContain("assign a scenario family before implementation")
  })
})
