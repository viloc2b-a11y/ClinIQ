import { Badge } from "@/components/ui/badge"
import type {
  ActionOwnerRole,
  ActionPriority,
  ActionStatus,
} from "@/lib/cliniq-core/action-center"
import { cn } from "@/lib/utils"

/** Fixed copy — not derived from CSS `capitalize` or locale. */
export const PRIORITY_LABEL: Record<ActionPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

export const STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  resolved: "Resolved",
}

export const OWNER_ROLE_LABEL: Record<ActionOwnerRole, string> = {
  billing: "Billing",
  coordinator: "Coordinator",
  site_manager: "Site manager",
  finance: "Finance",
  operations: "Operations",
  manual_review: "Manual review",
}

function priorityVariant(
  priority: ActionPriority,
): "destructive" | "warning" | "secondary" {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "warning"
    default:
      return "secondary"
  }
}

function statusVariant(
  status: ActionStatus,
): "outline" | "secondary" | "warning" | "success" {
  switch (status) {
    case "open":
      return "outline"
    case "in_progress":
      return "secondary"
    case "blocked":
      return "warning"
    case "resolved":
      return "success"
    default:
      return "outline"
  }
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ActionPriority
  className?: string
}) {
  return (
    <Badge variant={priorityVariant(priority)} className={cn("font-medium", className)}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  )
}

export function StatusBadge({
  status,
  className,
}: {
  status: ActionStatus
  className?: string
}) {
  return (
    <Badge variant={statusVariant(status)} className={cn("font-medium", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

export function OwnerRoleBadge({
  role,
  className,
}: {
  role: ActionOwnerRole
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("border-border font-normal", className)}>
      {OWNER_ROLE_LABEL[role]}
    </Badge>
  )
}
