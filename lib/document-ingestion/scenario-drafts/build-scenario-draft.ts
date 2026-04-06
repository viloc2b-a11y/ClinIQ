import type { ScenarioBlueprint } from "../scenario-blueprints/types"
import { buildDraftDescription } from "./build-draft-description"
import { buildDraftTitle } from "./build-draft-title"
import { buildPlaceholderStructureNotes } from "./build-placeholder-structure-notes"
import type { ScenarioDraft } from "./types"

export function buildScenarioDraft(blueprint: ScenarioBlueprint): Omit<ScenarioDraft, "order"> {
  return {
    code: `DRAFT_${blueprint.code}`,
    sourceBlueprintCode: blueprint.code,
    proposedScenarioKey: blueprint.proposedScenarioKey,
    familyKey: blueprint.familyKey,
    targetTags: [...blueprint.targetTags],
    structureIntent: blueprint.structureIntent,
    status: "draft_pending_definition",
    metadata: {
      title: buildDraftTitle(blueprint.proposedScenarioKey),
      description: buildDraftDescription(blueprint),
    },
    placeholderStructureNotes: buildPlaceholderStructureNotes(blueprint),
    rationale: [
      "draft_generated_from_blueprint",
      `source_blueprint:${blueprint.code}`,
      `structure_intent:${blueprint.structureIntent}`,
    ],
  }
}
