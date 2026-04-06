import type { ScenarioDraft } from "../scenario-drafts/types"

export function groupDraftsIntoReviewPacks(drafts: ScenarioDraft[]): Array<{
  familyKey: ScenarioDraft["familyKey"]
  structureIntent: ScenarioDraft["structureIntent"]
  drafts: ScenarioDraft[]
}> {
  const map = new Map<
    string,
    {
      familyKey: ScenarioDraft["familyKey"]
      structureIntent: ScenarioDraft["structureIntent"]
      drafts: ScenarioDraft[]
    }
  >()

  for (const draft of drafts) {
    const key = `${draft.familyKey ?? "null"}::${draft.structureIntent}`

    if (!map.has(key)) {
      map.set(key, {
        familyKey: draft.familyKey,
        structureIntent: draft.structureIntent,
        drafts: [],
      })
    }

    map.get(key)!.drafts.push(draft)
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      drafts: [...group.drafts].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        if (a.proposedScenarioKey !== b.proposedScenarioKey) {
          return a.proposedScenarioKey.localeCompare(b.proposedScenarioKey)
        }
        return a.code.localeCompare(b.code)
      }),
    }))
    .sort((a, b) => {
      if (a.familyKey === null && b.familyKey !== null) return 1
      if (a.familyKey !== null && b.familyKey === null) return -1
      if (a.familyKey !== b.familyKey) {
        return (a.familyKey ?? "").localeCompare(b.familyKey ?? "")
      }
      return a.structureIntent.localeCompare(b.structureIntent)
    })
}
