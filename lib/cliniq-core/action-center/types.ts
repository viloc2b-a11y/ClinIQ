/**
 * Action Center v1 — operational work queue on top of LeakageTraceResult (UI-ready contract).
 */

export type ActionOwnerRole =
  | "billing"
  | "coordinator"
  | "site_manager"
  | "finance"
  | "operations"
  | "manual_review"

export type ActionStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "resolved"

export type ActionPriority = "high" | "medium" | "low"

export type ActionType =
  | "prepare_invoice"
  | "resolve_claim_issue"
  | "collect_documentation"
  | "check_event_mapping"
  | "manual_review"

export interface ActionCenterItem {
  id: string
  studyId: string
  sponsorId?: string
  subjectId: string
  visitName: string
  lineCode: string

  actionType: ActionType
  ownerRole: ActionOwnerRole
  priority: ActionPriority
  status: ActionStatus

  title: string
  description: string

  expectedAmount: number
  invoicedAmount: number
  missingAmount: number

  leakageStatus: "missing" | "partial" | "not_invoice_ready"
  leakageReason:
    | "not_invoiced"
    | "partially_invoiced"
    | "claim_blocked"
    | "missing_documentation"
    | "requires_review"
    | "not_generated"
    | "unknown"

  eventLogId?: string
  billableInstanceId?: string
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
}

export interface ActionCenterSummary {
  totalOpen: number
  totalHighPriority: number
  totalMissingAmount: number
  byOwnerRole: Record<string, number>
  byActionType: Record<string, number>
}

export interface ActionCenterResult {
  items: ActionCenterItem[]
  summary: ActionCenterSummary
}
