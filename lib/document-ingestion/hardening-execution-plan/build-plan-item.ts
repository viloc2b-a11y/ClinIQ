import type { FamilyCoverageGap } from "../hardening-gaps/types"
import type { HardeningRecommendation } from "../hardening-recommendations/types"
import { planCountFromRecommendation } from "./plan-count-from-recommendation"
import { suggestFamiliesForTag } from "./suggest-families-for-tag"
import type { HardeningPlanItem } from "./types"

export function buildPlanItem(args: {
  recommendation: HardeningRecommendation
  familyGaps: FamilyCoverageGap[]
}): Omit<HardeningPlanItem, "order"> {
  const { recommendation, familyGaps } = args

  if (recommendation.type === "expand_family") {
    return {
      code: `PLAN_${recommendation.code}`,
      type: "create_scenarios_for_family",
      priority: recommendation.priority,
      target: recommendation.target,
      plannedScenarioCount: planCountFromRecommendation(recommendation),
      suggestedFamilyKeys:
        "familyKey" in recommendation.target ? [recommendation.target.familyKey] : [],
      rationale: [
        "family_gap_expansion",
        "direct_family_target",
        `recommendation_source:${recommendation.code}`,
      ],
    }
  }

  if (recommendation.type === "expand_tag") {
    return {
      code: `PLAN_${recommendation.code}`,
      type: "create_scenarios_for_tag",
      priority: recommendation.priority,
      target: recommendation.target,
      plannedScenarioCount: planCountFromRecommendation(recommendation),
      suggestedFamilyKeys: suggestFamiliesForTag(familyGaps),
      rationale: [
        "tag_coverage_expansion",
        "family_gap_guided_targeting",
        `recommendation_source:${recommendation.code}`,
      ],
    }
  }

  return {
    code: `PLAN_${recommendation.code}`,
    type: "rebalance_distribution",
    priority: recommendation.priority,
    target: recommendation.target,
    plannedScenarioCount: planCountFromRecommendation(recommendation),
    suggestedFamilyKeys: suggestFamiliesForTag(familyGaps),
    rationale: [
      "distribution_rebalancing",
      "multi_family_expansion",
      `recommendation_source:${recommendation.code}`,
    ],
  }
}
