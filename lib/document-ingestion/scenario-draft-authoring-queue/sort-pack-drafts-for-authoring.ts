import type { ScenarioDraft } from "../scenario-drafts/types"

export function sortPackDraftsForAuthoring(drafts: ScenarioDraft[]): ScenarioDraft[] {
  return [...drafts].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    if (a.proposedScenarioKey !== b.proposedScenarioKey) {
      return a.proposedScenarioKey.localeCompare(b.proposedScenarioKey)
    }
    return a.code.localeCompare(b.code)
  })
}
