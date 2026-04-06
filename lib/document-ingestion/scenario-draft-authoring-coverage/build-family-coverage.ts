import type {
  ScenarioDraftAuthoringCoverageFamily,
  ScenarioDraftAuthoringCoverageWorkset,
} from "./types"

export function buildFamilyCoverage(args: {
  worksets: ScenarioDraftAuthoringCoverageWorkset[]
  sourceWorksets: Array<{
    worksetCode: string
    items: Array<{ familyKey: ScenarioDraftAuthoringCoverageFamily["familyKey"] }>
  }>
}): ScenarioDraftAuthoringCoverageFamily[] {
  void args.worksets

  const familyKeys = [
    ...new Set(
      args.sourceWorksets.flatMap((workset) => workset.items.map((item) => item.familyKey)),
    ),
  ].sort((a, b) => {
    if (a === null && b !== null) return 1
    if (a !== null && b === null) return -1
    return (a ?? "").localeCompare(b ?? "")
  })

  return familyKeys.map((familyKey) => {
    const matchingWorksets = args.sourceWorksets.filter((workset) =>
      workset.items.some((item) => item.familyKey === familyKey),
    )

    const totalItems = matchingWorksets.reduce(
      (sum, workset) => sum + workset.items.filter((item) => item.familyKey === familyKey).length,
      0,
    )

    return {
      familyKey,
      totalItems,
      worksetCount: matchingWorksets.length,
      firstWorksetCode: matchingWorksets[0]?.worksetCode ?? null,
    }
  })
}
