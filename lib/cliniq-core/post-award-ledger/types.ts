/**
 * Module 5 — post-award ledger: execution events → billable instances → ledger vs expected.
 */

export type EventLog = {
  id: string
  studyId: string
  /** ISO 8601 timestamp */
  occurredAt: string
  /**
   * Domain event label (e.g. patient_randomized, visit_completed).
   * Not interpreted by the engine beyond billable generation rules.
   */
  eventType: string
  patientId?: string
  /** Protocol / budget line identifier */
  lineCode: string
  /** Billable units for this event (defaults to 1) */
  quantity?: number
}

export type ExpectedBillable = {
  id: string
  budgetLineId: string
  studyId?: string
  lineCode: string
  label: string
  category: string
  visitName: string
  unit: string
  expectedQuantity: number
  unitPrice: number
  /** Modeled revenue for this budget row (quantity × unit in budget terms) */
  expectedRevenue: number
}

export type BillableInstance = {
  id: string
  eventLogId: string
  studyId: string
  lineCode: string
  label: string
  category: string
  quantity: number
  unitAmount: number
  totalAmount: number
  occurredAt: string
}

export type LedgerEntryStatus = "full" | "partial" | "none" | "overage"

export type LedgerEntry = {
  lineCode: string
  label: string
  category: string
  expectedRevenue: number
  actualRevenue: number
  /** actualRevenue - expectedRevenue (negative = under-realized) */
  variance: number
  matchedBillableCount: number
  status: LedgerEntryStatus
}

export type RevenueLeakageReport = {
  totalExpectedRevenue: number
  totalActualRevenue: number
  /** Sum of max(0, expected − actual) per ledger line */
  leakageAmount: number
  /** Sum of max(0, actual − expected) per ledger line */
  overageAmount: number
  /** Lines with expected revenue but zero actual (nothing billed yet) */
  fullyMissingBillables: LedgerEntry[]
  /** Lines where 0 < actual < expected */
  partialBillables: LedgerEntry[]
}
