import type { ScenarioDraftAuthoringWorksetResult } from "../scenario-draft-authoring-worksets/types"
import { buildFamilyCoverage } from "./build-family-coverage"
import { buildStructureIntentCoverage } from "./build-structure-intent-coverage"
import { buildWorksetCoverage } from "./build-workset-coverage"
import type { ScenarioDraftAuthoringCoverageResult } from "./types"

export function buildScenarioDraftAuthoringCoverage(
  worksetResult: ScenarioDraftAuthoringWorksetResult,
): ScenarioDraftAuthoringCoverageResult {
  const warnings: ScenarioDraftAuthoringCoverageResult["warnings"] = []

  const worksets = worksetResult.data.worksets.map((workset) => buildWorksetCoverage(workset))

  const families = buildFamilyCoverage({
    worksets,
    sourceWorksets: worksetResult.data.worksets.map((workset) => ({
      worksetCode: workset.worksetCode,
      items: workset.items.map((item) => ({
        familyKey: item.familyKey,
      })),
    })),
  })

  const structureIntents = buildStructureIntentCoverage({
    worksets,
    sourceWorksets: worksetResult.data.worksets.map((workset) => ({
      worksetCode: workset.worksetCode,
      items: workset.items.map((item) => ({
        structureIntent: item.structureIntent,
      })),
    })),
  })

  if (worksetResult.data.worksets.length === 0) {
    warnings.push({
      code: "NO_AUTHORING_COVERAGE",
      message: "No authoring coverage generated because no worksets were provided.",
      severity: "info",
    })
  }

  const nullFamilyRepresented = families.some((family) => family.familyKey === null)

  if (nullFamilyRepresented) {
    warnings.push({
      code: "NULL_FAMILY_REPRESENTED_IN_AUTHORING_COVERAGE",
      message: "Authoring coverage includes drafts without family assignment.",
      severity: "warning",
    })
  }

  return {
    data: {
      worksets,
      families,
      structureIntents,
    },
    summary: {
      totalWorksets: worksets.length,
      totalScheduledItems: worksetResult.summary.totalQueueItems,
      representedFamilyCount: families.length,
      representedStructureIntentCount: structureIntents.length,
      nullFamilyRepresented,
      firstWorksetCode: worksets[0]?.worksetCode ?? null,
      firstFamilyKey: families[0]?.familyKey ?? null,
      firstStructureIntent: structureIntents[0]?.structureIntent ?? null,
    },
    warnings,
  }
}
