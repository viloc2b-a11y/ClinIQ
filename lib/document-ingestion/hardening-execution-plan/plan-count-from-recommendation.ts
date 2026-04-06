import type { HardeningRecommendation } from "../hardening-recommendations/types"

export function planCountFromRecommendation(recommendation: HardeningRecommendation): number {
  if (recommendation.type === "expand_family" && recommendation.priority === "high") {
    return 3
  }

  if (recommendation.type === "expand_family" && recommendation.priority === "medium") {
    return 2
  }

  if (recommendation.type === "expand_tag" && recommendation.priority === "high") {
    return 2
  }

  if (recommendation.type === "expand_tag" && recommendation.priority === "medium") {
    return 1
  }

  if (recommendation.type === "rebalance_distribution" && recommendation.priority === "medium") {
    return 3
  }

  return 1
}
