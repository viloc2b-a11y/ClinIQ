import type { ProcedureCondition } from "./cost-types"

export function applyOverhead(cost: number, overhead: number) {
  return cost * (1 + overhead)
}

export function applyMargin(cost: number, margin: number) {
  return cost / (1 - margin)
}

export function calculateConditionImpact(
  conditions: ProcedureCondition[] = []
) {
  return conditions.reduce((acc, c) => {
    return acc + (c.probability * c.cost_impact)
  }, 0)
}