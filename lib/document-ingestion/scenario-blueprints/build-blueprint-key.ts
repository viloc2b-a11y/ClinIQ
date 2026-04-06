import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import { normalizeBlueprintToken } from "./normalize-blueprint-token"

export function buildBlueprintKey(args: {
  planItem: HardeningPlanItem
  itemIndex: number
}): string {
  const n = args.itemIndex + 1

  if (
    args.planItem.type === "create_scenarios_for_family" &&
    "familyKey" in args.planItem.target
  ) {
    return `scenario_${normalizeBlueprintToken(args.planItem.target.familyKey)}_expansion_${n}`
  }

  if (args.planItem.type === "create_scenarios_for_tag" && "tag" in args.planItem.target) {
    return `scenario_tag_${normalizeBlueprintToken(args.planItem.target.tag)}_${n}`
  }

  return `scenario_distribution_rebalance_${n}`
}
