/**
 * Protocol Classification Layer v1 — deterministic billability from SoA-shaped rows.
 */

export type ProtocolBillability = "billable" | "non_billable" | "conditional"

export type ProtocolActivitySource = "soa_row" | "rule_engine"

export type ProtocolActivityCondition = {
  kind: string
  description: string
}

/**
 * Normalized schedule row (camelCase). Map from CSV/parser upstream if needed.
 */
export type SoARow = {
  studyId: string
  activityId: string
  visitName: string
  activityType: string
  /** Default 1 when omitted (matches single-occurrence activities). */
  quantity?: number
  /**
   * When set to an explicit non-billable sentinel (see rules), classification is `non_billable`.
   */
  billableTo?: string
  lineCode?: string
  feeCode?: string
}

export type ProtocolClassifiedActivity = {
  studyId: string
  activityId: string
  visitName: string
  lineCode?: string
  feeCode?: string
  classification: ProtocolBillability
  rationale: string
  conditions?: ProtocolActivityCondition[]
  source: ProtocolActivitySource
}
