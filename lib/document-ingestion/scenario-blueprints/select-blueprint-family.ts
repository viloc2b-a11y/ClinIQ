import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import type { ScenarioFamilyKey } from "../scenario-families/types"

export function selectBlueprintFamily(args: {
  planItem: HardeningPlanItem
  itemIndex: number
}): ScenarioFamilyKey | null {
  if (
    args.planItem.type === "create_scenarios_for_family" &&
    "familyKey" in args.planItem.target
  ) {
    return args.planItem.target.familyKey
  }

  const fromIndexedSuggestion = args.planItem.suggestedFamilyKeys[args.itemIndex]
  if (fromIndexedSuggestion) return fromIndexedSuggestion

  return args.planItem.suggestedFamilyKeys[0] ?? null
}
