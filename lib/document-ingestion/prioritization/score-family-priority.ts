import type { ScenarioFamilyKey } from "../scenario-families/types"
import type { FamilyPriority, ScenarioPriority } from "./types"

export function scoreFamilyPriority(args: {
  familyKey: ScenarioFamilyKey
  scenarioPriorities: ScenarioPriority[]
}): FamilyPriority {
  const familyScenarios = args.scenarioPriorities.filter(
    (item) => item.familyKey === args.familyKey,
  )

  const totalScenarios = familyScenarios.length
  const score = familyScenarios.reduce((sum, item) => sum + item.score, 0)

  let priority: "high" | "medium" | "low" = "low"
  if (score >= 16) priority = "high"
  else if (score >= 8) priority = "medium"

  return {
    familyKey: args.familyKey,
    score,
    priority,
    totalScenarios,
  }
}
