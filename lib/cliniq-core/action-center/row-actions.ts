/**
 * Action Center — row-level UI action contract (v1). No mutations; wiring only.
 */

export type ActionCenterRowAction =
  | "view_details"
  | "mark_in_progress"
  | "mark_resolved"
  | "assign_owner"
  | "escalate"
  | "open_related_claim"
  | "open_related_invoice"
  | "open_related_subject"

export interface ActionCenterRowActionDefinition {
  key: ActionCenterRowAction
  label: string
  enabled: boolean
  reasonIfDisabled?: string
}

export function getRowActions(params: {
  status: "open" | "in_progress" | "blocked" | "resolved"
  actionType:
    | "prepare_invoice"
    | "resolve_claim_issue"
    | "collect_documentation"
    | "check_event_mapping"
    | "manual_review"
}): ActionCenterRowActionDefinition[] {
  const isResolved = params.status === "resolved"

  return [
    {
      key: "view_details",
      label: "View details",
      enabled: true,
    },
    {
      key: "mark_in_progress",
      label: "Mark in progress",
      enabled: !isResolved,
    },
    {
      key: "mark_resolved",
      label: "Mark resolved",
      enabled: !isResolved,
    },
    {
      key: "assign_owner",
      label: "Assign owner",
      enabled: !isResolved,
    },
    {
      key: "escalate",
      label: "Escalate",
      enabled: !isResolved,
    },
    {
      key: "open_related_claim",
      label: "Open related claim",
      enabled: true,
    },
    {
      key: "open_related_invoice",
      label: "Open related invoice",
      enabled: true,
    },
    {
      key: "open_related_subject",
      label: "Open related subject",
      enabled: true,
    },
  ]
}
