import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import { buildBlueprintKey } from "./build-blueprint-key"
import { inferStructureIntent } from "./infer-structure-intent"
import { selectBlueprintFamily } from "./select-blueprint-family"
import { selectBlueprintTags } from "./select-blueprint-tags"
import type { ScenarioBlueprint } from "./types"

export function buildBlueprintsFromPlanItem(
  planItem: HardeningPlanItem,
): Omit<ScenarioBlueprint, "order">[] {
  const structureIntent = inferStructureIntent(planItem)

  return Array.from({ length: planItem.plannedScenarioCount }).map((_, index) => ({
    code: `BLUEPRINT_${planItem.code}_${index + 1}`,
    sourcePlanItemCode: planItem.code,
    familyKey: selectBlueprintFamily({
      planItem,
      itemIndex: index,
    }),
    proposedScenarioKey: buildBlueprintKey({
      planItem,
      itemIndex: index,
    }),
    targetTags: selectBlueprintTags(planItem),
    structureIntent,
    rationale: [
      "blueprint_generated_from_plan",
      `source_plan_item:${planItem.code}`,
      `structure_intent:${structureIntent}`,
    ],
  }))
}
