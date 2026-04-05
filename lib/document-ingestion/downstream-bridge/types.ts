export type DownstreamBridgeStatus =
  | "ready"
  | "partial"
  | "blocked"

export type SoaBridgeRow = {
  visitName: string
  activityDescription: string
  unitPrice: number | null
  sourceTrace?: Record<string, unknown>
}

export type BudgetBridgeRow = {
  category: string
  visitName: string | null
  unitPrice: number | null
  sourceTrace?: Record<string, unknown>
}

export type ContractBridgeRow = {
  clauseType: string
  clauseText: string
  sourceTrace?: Record<string, unknown>
}

export type DownstreamBridgeResult = {
  data: {
    soa: {
      rows: SoaBridgeRow[]
    }
    budget: {
      rows: BudgetBridgeRow[]
    }
    contract: {
      rows: ContractBridgeRow[]
    }
  }
  summary: {
    status: DownstreamBridgeStatus
    totalInputRecords: number
    soaRows: number
    budgetRows: number
    contractRows: number
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
