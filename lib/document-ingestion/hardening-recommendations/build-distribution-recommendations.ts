import type { TagCoverageEntry } from "../hardening-gaps/types"
import type { HardeningRecommendation } from "./types"

export function buildDistributionRecommendations(
  tagCoverage: TagCoverageEntry[],
): HardeningRecommendation[] {
  const weakOrMissing = tagCoverage.filter(
    (t) => t.coverageLevel === "weak" || t.coverageLevel === "missing",
  ).length

  if (weakOrMissing >= 4) {
    return [
      {
        code: "RECO_DISTRIBUTION_TAG_IMBALANCE",
        type: "rebalance_distribution",
        priority: "medium",
        message: "Tag coverage distribution is too thin across expected patterns.",
        target: { distribution: "tag_coverage" },
        suggestedActions: [
          "expand coverage across multiple tags",
          "avoid concentrating scenarios in a few patterns",
        ],
      },
    ]
  }

  return []
}
