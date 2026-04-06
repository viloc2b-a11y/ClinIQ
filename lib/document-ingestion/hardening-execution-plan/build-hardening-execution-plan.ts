import type { HardeningGapResult } from "../hardening-gaps/types"
import type { HardeningRecommendationResult } from "../hardening-recommendations/types"
import { buildPlanItem } from "./build-plan-item"
import type { HardeningExecutionPlanResult } from "./types"

export function buildHardeningExecutionPlan(args: {
  recommendations: HardeningRecommendationResult
  gaps: HardeningGapResult
}): HardeningExecutionPlanResult {
  const warnings: HardeningExecutionPlanResult["warnings"] = []

  const unsorted = args.recommendations.data.recommendations.map((recommendation) =>
    buildPlanItem({
      recommendation,
      familyGaps: args.gaps.data.familyCoverageGaps,
    }),
  )

  const priorityRank = { high: 0, medium: 1, low: 2 }
  const typeRank = {
    create_scenarios_for_family: 0,
    create_scenarios_for_tag: 1,
    rebalance_distribution: 2,
  }

  const sorted = [...unsorted].sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority]
    }
    if (typeRank[a.type] !== typeRank[b.type]) {
      return typeRank[a.type] - typeRank[b.type]
    }
    if (a.plannedScenarioCount !== b.plannedScenarioCount) {
      return b.plannedScenarioCount - a.plannedScenarioCount
    }
    return a.code.localeCompare(b.code)
  })

  const planItems = sorted.map((item, index) => ({
    ...item,
    order: index + 1,
  }))

  if (planItems.length === 0) {
    warnings.push({
      code: "NO_PLAN_ITEMS",
      message: "No hardening execution plan items generated.",
      severity: "info",
    })
  }

  return {
    data: {
      planItems,
    },
    summary: {
      totalPlanItems: planItems.length,
      totalPlannedScenarios: planItems.reduce((sum, item) => sum + item.plannedScenarioCount, 0),
      highPriorityItems: planItems.filter((item) => item.priority === "high").length,
      mediumPriorityItems: planItems.filter((item) => item.priority === "medium").length,
      lowPriorityItems: planItems.filter((item) => item.priority === "low").length,
      firstPlanItemCode: planItems[0]?.code ?? null,
    },
    warnings,
  }
}
