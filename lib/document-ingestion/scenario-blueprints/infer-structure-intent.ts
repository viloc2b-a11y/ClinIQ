import type { HardeningPlanItem } from "../hardening-execution-plan/types"
import type { ScenarioBlueprint } from "./types"

export function inferStructureIntent(
  planItem: HardeningPlanItem,
): ScenarioBlueprint["structureIntent"] {
  if (planItem.type === "create_scenarios_for_tag") {
    return "edge_case_expansion"
  }

  if (planItem.type === "create_scenarios_for_family") {
    return "family_depth_expansion"
  }

  return "distribution_rebalance"
}
