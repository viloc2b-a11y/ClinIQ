export type RoleCost = {
  role_code: string
  hourly_cost: number
}

export type ProcedureTime = {
  role_code: string
  minutes: number
}

export type ProcedureCondition = {
  probability: number
  cost_impact: number
}

export type Procedure = {
  id: string
  name: string
  times: ProcedureTime[]
  conditions?: ProcedureCondition[]
}

export type SiteCostProfile = {
  overhead_percent: number
  margin_target: number
}

export type CostBreakdown = {
  base_cost: number
  condition_cost: number
  total_cost: number
  price_with_margin: number
}