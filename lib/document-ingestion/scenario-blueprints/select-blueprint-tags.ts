import type { HardeningPlanItem } from "../hardening-execution-plan/types"

export function selectBlueprintTags(planItem: HardeningPlanItem): string[] {
  if (planItem.type === "create_scenarios_for_tag" && "tag" in planItem.target) {
    return [planItem.target.tag]
  }

  if (planItem.type === "create_scenarios_for_family") {
    return ["family-expansion"]
  }

  return ["distribution-rebalance"]
}
