import type { ScenarioBlueprint } from "../scenario-blueprints/types"

export function buildPlaceholderStructureNotes(blueprint: ScenarioBlueprint): string[] {
  const notes: string[] = []

  notes.push("define representative input structure for this draft")
  notes.push("document expected parsing difficulty and edge conditions")
  notes.push("keep fixture design deterministic and minimal")

  if (blueprint.structureIntent === "edge_case_expansion") {
    notes.push("emphasize tag-driven structural variation")
  }

  if (blueprint.structureIntent === "family_depth_expansion") {
    notes.push("expand coverage depth within the assigned family")
  }

  if (blueprint.structureIntent === "distribution_rebalance") {
    notes.push("improve cross-pattern distribution coverage")
  }

  if (blueprint.familyKey === null) {
    notes.push("assign a scenario family before implementation")
  }

  return notes
}
