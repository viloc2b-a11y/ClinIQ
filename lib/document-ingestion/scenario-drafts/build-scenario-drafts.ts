import type { ScenarioBlueprintResult } from "../scenario-blueprints/types"
import { buildScenarioDraft } from "./build-scenario-draft"
import type { ScenarioDraftResult } from "./types"

export function buildScenarioDrafts(blueprintResult: ScenarioBlueprintResult): ScenarioDraftResult {
  const warnings: ScenarioDraftResult["warnings"] = []

  const blueprintOrderMap = new Map(
    blueprintResult.data.blueprints.map((item) => [item.code, item.order]),
  )

  const unsorted = blueprintResult.data.blueprints.map((blueprint) => buildScenarioDraft(blueprint))

  const sorted = [...unsorted].sort((a, b) => {
    const orderA = blueprintOrderMap.get(a.sourceBlueprintCode) ?? Number.MAX_SAFE_INTEGER
    const orderB = blueprintOrderMap.get(b.sourceBlueprintCode) ?? Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) return orderA - orderB
    if (a.proposedScenarioKey !== b.proposedScenarioKey) {
      return a.proposedScenarioKey.localeCompare(b.proposedScenarioKey)
    }
    return a.code.localeCompare(b.code)
  })

  const drafts = sorted.map((item, index) => ({
    ...item,
    order: index + 1,
  }))

  const nullFamilyCount = drafts.filter((item) => item.familyKey === null).length

  if (drafts.length === 0) {
    warnings.push({
      code: "NO_DRAFTS",
      message: "No scenario drafts generated.",
      severity: "info",
    })
  }

  if (nullFamilyCount > 0) {
    warnings.push({
      code: "DRAFTS_WITH_NULL_FAMILY",
      message: "Some scenario drafts do not have a family assignment yet.",
      severity: "warning",
    })
  }

  return {
    data: {
      drafts,
    },
    summary: {
      totalDrafts: drafts.length,
      nullFamilyCount,
      edgeCaseExpansionCount: drafts.filter((d) => d.structureIntent === "edge_case_expansion")
        .length,
      familyDepthExpansionCount: drafts.filter(
        (d) => d.structureIntent === "family_depth_expansion",
      ).length,
      distributionRebalanceCount: drafts.filter(
        (d) => d.structureIntent === "distribution_rebalance",
      ).length,
      firstDraftCode: drafts[0]?.code ?? null,
    },
    warnings,
  }
}
