import type { FamilyCoverageGap } from "../hardening-gaps/types"
import type { HardeningRecommendation } from "./types"

export function buildFamilyRecommendations(
  familyGaps: FamilyCoverageGap[],
): HardeningRecommendation[] {
  const results: HardeningRecommendation[] = []

  for (const gap of familyGaps) {
    if (gap.gapLevel === "high") {
      results.push({
        code: `RECO_FAMILY_HIGH_${gap.familyKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "expand_family",
        priority: "high",
        message: `Family "${gap.familyKey}" has critical coverage gap.`,
        target: { familyKey: gap.familyKey },
        suggestedActions: [
          "add multiple new scenarios",
          "introduce edge-case variations",
          "increase structural diversity within this family",
        ],
      })
    }

    if (gap.gapLevel === "medium") {
      results.push({
        code: `RECO_FAMILY_MEDIUM_${gap.familyKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "expand_family",
        priority: "medium",
        message: `Family "${gap.familyKey}" needs deeper coverage.`,
        target: { familyKey: gap.familyKey },
        suggestedActions: [
          "add at least one new scenario",
          "cover additional structure variations",
        ],
      })
    }
  }

  return results.sort((a, b) => a.code.localeCompare(b.code))
}
