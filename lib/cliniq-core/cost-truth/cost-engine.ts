import type {
  Procedure,
  RoleCost,
  SiteCostProfile,
  CostBreakdown,
} from "./cost-types"
import {
  applyOverhead,
  applyMargin,
  calculateConditionImpact,
} from "./cost-rules"

export function calculateProcedureCost(
  procedure: Procedure,
  roleCosts: RoleCost[],
  siteCostProfile: SiteCostProfile
): CostBreakdown {
  const base_cost = procedure.times.reduce((total, timeEntry) => {
    const role = roleCosts.find((r) => r.role_code === timeEntry.role_code)

    if (!role) {
      throw new Error(`Missing role cost for role_code: ${timeEntry.role_code}`)
    }

    return total + (timeEntry.minutes / 60) * role.hourly_cost
  }, 0)

  const condition_cost = calculateConditionImpact(procedure.conditions ?? [])

  const total_cost = applyOverhead(
    base_cost + condition_cost,
    siteCostProfile.overhead_percent
  )

  const price_with_margin = applyMargin(
    total_cost,
    siteCostProfile.margin_target
  )

 return {
  base_cost: Number(base_cost.toFixed(2)),
  condition_cost: Number(condition_cost.toFixed(2)),
  total_cost: Number(total_cost.toFixed(2)),
  price_with_margin: Number(price_with_margin.toFixed(2)),
}
}