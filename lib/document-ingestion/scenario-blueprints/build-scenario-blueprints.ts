import type { HardeningExecutionPlanResult } from "../hardening-execution-plan/types"
import { buildBlueprintsFromPlanItem } from "./build-blueprints-from-plan-item"
import type { ScenarioBlueprintResult } from "./types"

export function buildScenarioBlueprints(
  executionPlan: HardeningExecutionPlanResult,
): ScenarioBlueprintResult {
  const warnings: ScenarioBlueprintResult["warnings"] = []

  const expanded = executionPlan.data.planItems.flatMap((planItem) =>
    buildBlueprintsFromPlanItem(planItem),
  )

  const planOrderMap = new Map(
    executionPlan.data.planItems.map((item) => [item.code, item.order]),
  )

  const sorted = [...expanded].sort((a, b) => {
    const orderA = planOrderMap.get(a.sourcePlanItemCode) ?? Number.MAX_SAFE_INTEGER
    const orderB = planOrderMap.get(b.sourcePlanItemCode) ?? Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) return orderA - orderB
    if (a.proposedScenarioKey !== b.proposedScenarioKey) {
      return a.proposedScenarioKey.localeCompare(b.proposedScenarioKey)
    }
    return a.code.localeCompare(b.code)
  })

  const blueprints = sorted.map((item, index) => ({
    ...item,
    order: index + 1,
  }))

  if (blueprints.length === 0) {
    warnings.push({
      code: "NO_BLUEPRINTS",
      message: "No scenario blueprints generated.",
      severity: "info",
    })
  }

  return {
    data: {
      blueprints,
    },
    summary: {
      totalBlueprints: blueprints.length,
      edgeCaseExpansionCount: blueprints.filter((b) => b.structureIntent === "edge_case_expansion")
        .length,
      familyDepthExpansionCount: blueprints.filter(
        (b) => b.structureIntent === "family_depth_expansion",
      ).length,
      distributionRebalanceCount: blueprints.filter(
        (b) => b.structureIntent === "distribution_rebalance",
      ).length,
      firstBlueprintCode: blueprints[0]?.code ?? null,
    },
    warnings,
  }
}
