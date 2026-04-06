import type { HardeningGapResult } from "../hardening-gaps/types"
import { buildDistributionRecommendations } from "./build-distribution-recommendations"
import { buildFamilyRecommendations } from "./build-family-recommendations"
import { buildTagRecommendations } from "./build-tag-recommendations"
import type { HardeningRecommendationResult } from "./types"

export function buildHardeningRecommendations(gaps: HardeningGapResult): HardeningRecommendationResult {
  const warnings: HardeningRecommendationResult["warnings"] = []

  const tagRecommendations = buildTagRecommendations(gaps.data.tagCoverage)
  const familyRecommendations = buildFamilyRecommendations(gaps.data.familyCoverageGaps)
  const distributionRecommendations = buildDistributionRecommendations(gaps.data.tagCoverage)

  const recommendations = [
    ...familyRecommendations,
    ...tagRecommendations,
    ...distributionRecommendations,
  ]

  const priorityRank = { high: 0, medium: 1, low: 2 }
  const typeRank = { expand_family: 0, expand_tag: 1, rebalance_distribution: 2 }

  recommendations.sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority]
    }
    if (typeRank[a.type] !== typeRank[b.type]) {
      return typeRank[a.type] - typeRank[b.type]
    }
    return a.code.localeCompare(b.code)
  })

  if (recommendations.length === 0) {
    warnings.push({
      code: "NO_RECOMMENDATIONS",
      message: "No hardening recommendations generated.",
      severity: "info",
    })
  }

  return {
    data: {
      recommendations,
    },
    summary: {
      totalRecommendations: recommendations.length,
      highPriority: recommendations.filter((r) => r.priority === "high").length,
      mediumPriority: recommendations.filter((r) => r.priority === "medium").length,
      lowPriority: recommendations.filter((r) => r.priority === "low").length,
      topRecommendationCode: recommendations[0]?.code ?? null,
    },
    warnings,
  }
}
