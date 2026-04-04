/**
 * Protocol Classification Layer v1 — deterministic billability from SoA-shaped rows.
 */

export type ProtocolBillability = "billable" | "non_billable" | "conditional"

export type ProtocolActivitySource = "soa_row" | "rule_engine"

/** All v1 condition kinds emitted by `classifyActivity` (deterministic, closed set). */
export const PROTOCOL_CONDITION_KINDS = [
  "requires_screen_failure",
  "occurrence_limit",
  "sponsor_exception",
  "manual_review",
  "unscheduled_visit",
  "repeat_lab",
] as const

export type ProtocolConditionKind = (typeof PROTOCOL_CONDITION_KINDS)[number]

export type ProtocolActivityCondition = {
  kind: ProtocolConditionKind
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
  /**
   * When true, row is treated as sponsor-approved exception path (see rules order).
   * Upstream may set this from CTMS / amendment flags.
   */
  sponsorException?: boolean
  /** Optional economics from source grid (e.g. CSV unit_cost × quantity). */
  unitPrice?: number
  expectedRevenue?: number
  /** Maps to classified `protocolUnit` → ExpectedBillable.unit when present. */
  protocolUnit?: string
}

export type ProtocolClassifiedActivity = {
  studyId: string
  activityId: string
  visitName: string
  /** Carried from SoA / source row for labeling; optional if unknown. */
  activityType?: string
  lineCode?: string
  feeCode?: string
  /**
   * When all three are set and mutually consistent, `protocolActivitiesToExpectedBillables`
   * may emit Module 5 rows without fabricating economics. Omitted → billable lines defer.
   */
  unitPrice?: number
  expectedQuantity?: number
  expectedRevenue?: number
  /** When set, maps to `ExpectedBillable.unit`; otherwise adapter uses `"ea"`. */
  protocolUnit?: string
  classification: ProtocolBillability
  rationale: string
  conditions?: ProtocolActivityCondition[]
  source: ProtocolActivitySource
}
