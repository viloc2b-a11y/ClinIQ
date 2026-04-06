import type { ScenarioCatalogEntry } from "../scenario-catalog/types"
import type { HardeningRoadmapResult } from "../hardening-roadmap/types"
import type { PrioritizationResult } from "../prioritization/types"
import { buildFamilyCoverageGaps } from "./build-family-coverage-gaps"
import { buildTagCoverage } from "./build-tag-coverage"
import type { HardeningGap, HardeningGapResult } from "./types"

export function buildHardeningGaps(args: {
  catalog: ScenarioCatalogEntry[]
  prioritization: PrioritizationResult
  roadmap: HardeningRoadmapResult
}): HardeningGapResult {
  const warnings: HardeningGapResult["warnings"] = []

  const tagCoverage = buildTagCoverage({
    catalog: args.catalog,
    scenarioPriorities: args.prioritization.data.scenarioPriorities,
  })

  const familyCoverageGaps = buildFamilyCoverageGaps({
    familyPriorities: args.prioritization.data.familyPriorities,
    scenarioPriorities: args.prioritization.data.scenarioPriorities,
    roadmapFamilies: args.roadmap.data.families,
  })

  const gaps: HardeningGap[] = []

  for (const item of tagCoverage) {
    if (item.coverageLevel === "missing") {
      gaps.push({
        code: `TAG_MISSING_${item.tag.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "tag",
        severity: "high",
        message: `Expected tag "${item.tag}" is not represented in any scenario.`,
      })
    } else if (item.coverageLevel === "weak") {
      gaps.push({
        code: `TAG_WEAK_${item.tag.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "tag",
        severity: "medium",
        message: `Expected tag "${item.tag}" is represented too weakly.`,
      })
    }
  }

  for (const item of familyCoverageGaps) {
    if (item.gapLevel === "high") {
      gaps.push({
        code: `FAMILY_HIGH_GAP_${item.familyKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "family",
        severity: "high",
        message: `Family "${item.familyKey}" has high coverage gap.`,
      })
    } else if (item.gapLevel === "medium") {
      gaps.push({
        code: `FAMILY_MEDIUM_GAP_${item.familyKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        type: "family",
        severity: "medium",
        message: `Family "${item.familyKey}" has medium coverage gap.`,
      })
    }
  }

  const weakOrMissingTagCount = tagCoverage.filter(
    (item) => item.coverageLevel === "weak" || item.coverageLevel === "missing",
  ).length

  if (weakOrMissingTagCount >= 4) {
    gaps.push({
      code: "DISTRIBUTION_TAG_COVERAGE_THIN",
      type: "distribution",
      severity: "medium",
      message: "Too many expected tags are weakly represented or missing.",
    })
  }

  const severityRank = { high: 0, medium: 1, low: 2 }
  const typeRank = { family: 0, tag: 1, distribution: 2 }

  gaps.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity]
    }
    if (typeRank[a.type] !== typeRank[b.type]) {
      return typeRank[a.type] - typeRank[b.type]
    }
    return a.code.localeCompare(b.code)
  })

  if (args.catalog.length === 0) {
    warnings.push({
      code: "EMPTY_CATALOG",
      message: "Catalog is empty. Gap analysis may be incomplete.",
      severity: "warning",
    })
  }

  if (args.prioritization.data.scenarioPriorities.length === 0) {
    warnings.push({
      code: "EMPTY_PRIORITIZATION",
      message: "Prioritization is empty. Gap analysis may be incomplete.",
      severity: "warning",
    })
  }

  if (args.roadmap.data.families.length === 0) {
    warnings.push({
      code: "EMPTY_ROADMAP",
      message: "Roadmap is empty. Gap analysis may be incomplete.",
      severity: "warning",
    })
  }

  return {
    data: {
      tagCoverage,
      familyCoverageGaps,
      gaps,
    },
    summary: {
      totalTags: tagCoverage.length,
      weakTagCount: tagCoverage.filter((item) => item.coverageLevel === "weak").length,
      missingTagCount: tagCoverage.filter((item) => item.coverageLevel === "missing").length,
      familiesWithHighGap: familyCoverageGaps.filter((item) => item.gapLevel === "high").length,
      familiesWithMediumGap: familyCoverageGaps.filter((item) => item.gapLevel === "medium").length,
      familiesWithLowGap: familyCoverageGaps.filter((item) => item.gapLevel === "low").length,
      topGapCode: gaps[0]?.code ?? null,
    },
    warnings,
  }
}
