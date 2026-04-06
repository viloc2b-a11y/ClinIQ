import type { ScenarioBlueprint } from "../scenario-blueprints/types"

export function buildDraftDescription(blueprint: ScenarioBlueprint): string {
  return [
    "Placeholder scenario draft for future definition.",
    `Structure intent: ${blueprint.structureIntent}.`,
    `Source blueprint: ${blueprint.code}.`,
  ].join(" ")
}
