import type { ScenarioDraftAuthoringQueueResult } from "../scenario-draft-authoring-queue/types"
import { buildAuthoringWorkset } from "./build-authoring-workset"
import { chunkAuthoringQueueItems } from "./chunk-authoring-queue-items"
import { SCENARIO_DRAFT_AUTHORING_WORKSET_SIZE } from "./constants"
import type { ScenarioDraftAuthoringWorksetResult } from "./types"

export function buildScenarioDraftAuthoringWorksets(
  queueResult: ScenarioDraftAuthoringQueueResult,
): ScenarioDraftAuthoringWorksetResult {
  const warnings: ScenarioDraftAuthoringWorksetResult["warnings"] = []

  const chunks = chunkAuthoringQueueItems(
    queueResult.data.queueItems,
    SCENARIO_DRAFT_AUTHORING_WORKSET_SIZE,
  )

  const worksets = chunks.map((items, index) =>
    buildAuthoringWorkset({
      worksetPosition: index + 1,
      items,
    }),
  )

  if (queueResult.data.queueItems.length === 0) {
    warnings.push({
      code: "NO_AUTHORING_WORKSETS",
      message: "No authoring worksets generated because no queue items were provided.",
      severity: "info",
    })
  }

  const worksetsWithNullFamilyItems = worksets.filter(
    (workset) => workset.summary.nullFamilyItemCount > 0,
  ).length

  if (worksetsWithNullFamilyItems > 0) {
    warnings.push({
      code: "AUTHORING_WORKSETS_WITH_NULL_FAMILY_ITEMS",
      message: "Some authoring worksets contain queue items without family assignment.",
      severity: "warning",
    })
  }

  const sizes = worksets.map((workset) => workset.summary.totalItems)

  return {
    data: {
      worksets,
    },
    summary: {
      totalWorksets: worksets.length,
      totalQueueItems: queueResult.data.queueItems.length,
      configuredWorksetSize: SCENARIO_DRAFT_AUTHORING_WORKSET_SIZE,
      firstWorksetCode: worksets[0]?.worksetCode ?? null,
      lastWorksetCode: worksets[worksets.length - 1]?.worksetCode ?? null,
      worksetsWithNullFamilyItems,
      maxWorksetSizeObserved: sizes.length > 0 ? Math.max(...sizes) : 0,
      minWorksetSizeObserved: sizes.length > 0 ? Math.min(...sizes) : 0,
    },
    warnings,
  }
}
