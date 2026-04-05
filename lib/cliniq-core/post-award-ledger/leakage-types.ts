/**
 * Leakage v2 — traceable, actionable item shapes (domain contract).
 * Builders map from billables / ledger / claims / invoice into these types.
 *
 * Monetary rule: missingAmount = max(expectedAmount - invoicedAmount, 0) (deterministic).
 */

export interface LeakageTraceItem {
  studyId: string
  sponsorId?: string
  subjectId: string
  visitName: string
  lineCode: string
  eventLogId?: string
  billableInstanceId?: string

  expectedAmount: number
  invoicedAmount: number
  missingAmount: number

  status: "missing" | "partial" | "not_invoice_ready"

  reason:
    | "not_invoiced"
    | "partially_invoiced"
    | "claim_blocked"
    | "missing_documentation"
    | "requires_review"
    | "not_generated"
    | "unknown"

  actionHint:
    | "review_claim"
    | "prepare_invoice"
    | "resolve_blocking_issue"
    | "check_event_mapping"
    | "collect_documentation"
    | "manual_review"

  invoicePeriodStart?: string
  invoicePeriodEnd?: string
}

export interface LeakageTraceSummary {
  totalExpectedAmount: number
  totalInvoicedAmount: number
  totalMissingAmount: number
  itemCount: number
  missingCount: number
  partialCount: number
  blockedCount: number
}

export interface LeakageTraceResult {
  items: LeakageTraceItem[]
  summary: LeakageTraceSummary
}
