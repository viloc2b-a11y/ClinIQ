/**
 * Action Center builder — one ActionCenterItem per LeakageTraceItem (deterministic).
 */

import type { LeakageTraceItem, LeakageTraceResult } from "../post-award-ledger/leakage-types"
import type {
  ActionCenterItem,
  ActionCenterResult,
  ActionCenterSummary,
  ActionOwnerRole,
  ActionPriority,
  ActionType,
} from "./types"

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function deterministicActionCenterItemId(item: LeakageTraceItem): string {
  return [item.studyId, item.subjectId, item.visitName, item.lineCode, item.reason].join("::")
}

function actionTypeFromHint(hint: LeakageTraceItem["actionHint"]): ActionType {
  switch (hint) {
    case "prepare_invoice":
      return "prepare_invoice"
    case "resolve_blocking_issue":
    case "review_claim":
      return "resolve_claim_issue"
    case "collect_documentation":
      return "collect_documentation"
    case "check_event_mapping":
      return "check_event_mapping"
    case "manual_review":
    default:
      return "manual_review"
  }
}

function ownerRoleFromTrace(trace: LeakageTraceItem, actionType: ActionType): ActionOwnerRole {
  if (actionType === "prepare_invoice") return "billing"
  if (actionType === "collect_documentation") return "coordinator"
  if (actionType === "check_event_mapping") return "operations"
  if (actionType === "manual_review") return "manual_review"
  if (actionType === "resolve_claim_issue") {
    if (trace.reason === "requires_review") return "site_manager"
    if (trace.reason === "claim_blocked") return "finance"
    return "manual_review"
  }
  return "manual_review"
}

function priorityFromTrace(trace: LeakageTraceItem): ActionPriority {
  if (
    trace.status === "not_invoice_ready" &&
    (trace.reason === "requires_review" || trace.reason === "claim_blocked")
  ) {
    return "high"
  }
  if (trace.missingAmount >= 1000) return "high"
  if (trace.missingAmount >= 250 && trace.missingAmount < 1000) return "medium"
  return "low"
}

function fmtUsd(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function subjectLabel(subjectId: string): string {
  return subjectId !== "" ? subjectId : "Unknown subject"
}

function titleFrom(trace: LeakageTraceItem, actionType: ActionType): string {
  const line = trace.lineCode
  const visit = trace.visitName
  switch (actionType) {
    case "prepare_invoice":
      return `Prepare invoice for ${line} on ${visit}`
    case "collect_documentation":
      return `Collect documentation for ${line} on ${visit}`
    case "resolve_claim_issue":
      return `Resolve claim issue for ${line} on ${visit}`
    case "check_event_mapping":
      return `Check event mapping for ${line} on ${visit}`
    case "manual_review":
    default:
      return `Manual review for ${line} on ${visit}`
  }
}

function descriptionFrom(trace: LeakageTraceItem): string {
  const head = `${subjectLabel(trace.subjectId)} / ${trace.visitName} / ${trace.lineCode}`
  const m = fmtUsd(trace.missingAmount)
  switch (trace.reason) {
    case "not_invoiced":
      return `${head} has $${m} missing because it was not invoiced.`
    case "partially_invoiced":
      return `${head} has $${m} missing because it was only partially invoiced.`
    case "claim_blocked":
      return `${head} has $${m} missing and claim processing is blocked.`
    case "missing_documentation":
      return `${head} has $${m} missing and is blocked pending documentation.`
    case "requires_review":
      return `${head} has $${m} missing and requires review before invoicing.`
    case "not_generated":
      return `${head} has $${m} missing because no downstream billing record was found.`
    case "unknown":
    default:
      return `${head} has $${m} missing for an unknown reason.`
  }
}

function traceToActionItem(trace: LeakageTraceItem): ActionCenterItem {
  const actionType = actionTypeFromHint(trace.actionHint)
  return {
    id: deterministicActionCenterItemId(trace),
    studyId: trace.studyId,
    sponsorId: trace.sponsorId,
    subjectId: trace.subjectId,
    visitName: trace.visitName,
    lineCode: trace.lineCode,
    actionType,
    ownerRole: ownerRoleFromTrace(trace, actionType),
    priority: priorityFromTrace(trace),
    status: "open",
    title: titleFrom(trace, actionType),
    description: descriptionFrom(trace),
    expectedAmount: trace.expectedAmount,
    invoicedAmount: trace.invoicedAmount,
    missingAmount: trace.missingAmount,
    leakageStatus: trace.status,
    leakageReason: trace.reason,
    eventLogId: trace.eventLogId,
    billableInstanceId: trace.billableInstanceId,
    invoicePeriodStart: trace.invoicePeriodStart,
    invoicePeriodEnd: trace.invoicePeriodEnd,
  }
}

function summarize(items: ActionCenterItem[]): ActionCenterSummary {
  const byOwnerRole: Record<string, number> = {}
  const byActionType: Record<string, number> = {}
  let totalHighPriority = 0
  let totalMissingAmount = 0

  for (const it of items) {
    byOwnerRole[it.ownerRole] = (byOwnerRole[it.ownerRole] ?? 0) + 1
    byActionType[it.actionType] = (byActionType[it.actionType] ?? 0) + 1
    if (it.priority === "high") totalHighPriority += 1
    totalMissingAmount += it.missingAmount
  }

  return {
    totalOpen: items.length,
    totalHighPriority,
    totalMissingAmount,
    byOwnerRole,
    byActionType,
  }
}

function compareItems(a: ActionCenterItem, b: ActionCenterItem): number {
  const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  if (pd !== 0) return pd
  const keys = ["studyId", "subjectId", "visitName", "lineCode"] as const
  for (const k of keys) {
    const c = a[k].localeCompare(b[k], undefined, { sensitivity: "variant" })
    if (c !== 0) return c
  }
  return 0
}

export function buildActionCenter(params: { leakageTrace: LeakageTraceResult }): ActionCenterResult {
  const { leakageTrace } = params
  const items = leakageTrace.items.map(traceToActionItem).sort(compareItems)
  return {
    items,
    summary: summarize(items),
  }
}
