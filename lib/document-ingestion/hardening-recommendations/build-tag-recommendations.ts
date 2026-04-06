import type { TagCoverageEntry } from "../hardening-gaps/types"
import type { HardeningRecommendation } from "./types"

export function buildTagRecommendations(tagCoverage: TagCoverageEntry[]): HardeningRecommendation[] {
  const results: HardeningRecommendation[] = []

  for (const tagEntry of tagCoverage) {
    if (tagEntry.coverageLevel === "missing") {
      results.push({
        code: `RECO_TAG_MISSING_${tagEntry.tag.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "expand_tag",
        priority: "high",
        message: `Tag "${tagEntry.tag}" is not represented. Create new scenarios.`,
        target: { tag: tagEntry.tag },
        suggestedActions: [
          "create new scenario with this structural pattern",
          "add scenario to at least one existing family",
          "ensure tag appears in multiple families",
        ],
      })
    }

    if (tagEntry.coverageLevel === "weak") {
      results.push({
        code: `RECO_TAG_WEAK_${tagEntry.tag.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "expand_tag",
        priority: "medium",
        message: `Tag "${tagEntry.tag}" has weak coverage. Increase representation.`,
        target: { tag: tagEntry.tag },
        suggestedActions: [
          "add at least one additional scenario",
          "introduce variation of this pattern",
        ],
      })
    }
  }

  return results.sort((a, b) => a.code.localeCompare(b.code))
}
