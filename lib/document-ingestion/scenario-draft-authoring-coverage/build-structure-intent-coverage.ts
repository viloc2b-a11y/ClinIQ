import type {
  ScenarioDraftAuthoringCoverageStructureIntent,
  ScenarioDraftAuthoringCoverageWorkset,
} from "./types"

const STRUCTURE_INTENT_PRIORITY: Record<
  ScenarioDraftAuthoringCoverageStructureIntent["structureIntent"],
  number
> = {
  edge_case_expansion: 1,
  family_depth_expansion: 2,
  distribution_rebalance: 3,
}

export function buildStructureIntentCoverage(args: {
  worksets: ScenarioDraftAuthoringCoverageWorkset[]
  sourceWorksets: Array<{
    worksetCode: string
    items: Array<{
      structureIntent: ScenarioDraftAuthoringCoverageStructureIntent["structureIntent"]
    }>
  }>
}): ScenarioDraftAuthoringCoverageStructureIntent[] {
  void args.worksets

  const structureIntents = [
    ...new Set(
      args.sourceWorksets.flatMap((workset) => workset.items.map((item) => item.structureIntent)),
    ),
  ].sort((a, b) => STRUCTURE_INTENT_PRIORITY[a] - STRUCTURE_INTENT_PRIORITY[b])

  return structureIntents.map((structureIntent) => {
    const matchingWorksets = args.sourceWorksets.filter((workset) =>
      workset.items.some((item) => item.structureIntent === structureIntent),
    )

    const totalItems = matchingWorksets.reduce(
      (sum, workset) =>
        sum + workset.items.filter((item) => item.structureIntent === structureIntent).length,
      0,
    )

    return {
      structureIntent,
      totalItems,
      worksetCount: matchingWorksets.length,
      firstWorksetCode: matchingWorksets[0]?.worksetCode ?? null,
    }
  })
}
