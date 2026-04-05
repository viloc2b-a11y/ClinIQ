import type { ActionCenterItem } from "./types"
import type { ActionItemRow } from "./persistence-types"

export function mapActionCenterItemToRow(item: ActionCenterItem): ActionItemRow {
  return {
    id: item.id,
    study_id: item.studyId,
    sponsor_id: item.sponsorId ?? null,
    subject_id: item.subjectId,
    visit_name: item.visitName,
    line_code: item.lineCode,
    action_type: item.actionType,
    owner_role: item.ownerRole,
    priority: item.priority,
    status: item.status,
    title: item.title,
    description: item.description,
    expected_amount: item.expectedAmount,
    invoiced_amount: item.invoicedAmount,
    missing_amount: item.missingAmount,
    leakage_status: item.leakageStatus,
    leakage_reason: item.leakageReason,
    event_log_id: item.eventLogId ?? null,
    billable_instance_id: item.billableInstanceId ?? null,
    invoice_period_start: item.invoicePeriodStart ?? null,
    invoice_period_end: item.invoicePeriodEnd ?? null,
    source_hash: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: item.status === "resolved" ? new Date().toISOString() : null,
  }
}

export function mapRowToActionCenterItem(row: ActionItemRow): ActionCenterItem {
  return {
    id: row.id,
    studyId: row.study_id,
    sponsorId: row.sponsor_id ?? undefined,
    subjectId: row.subject_id,
    visitName: row.visit_name,
    lineCode: row.line_code,
    actionType: row.action_type as ActionCenterItem["actionType"],
    ownerRole: row.owner_role as ActionCenterItem["ownerRole"],
    priority: row.priority as ActionCenterItem["priority"],
    status: row.status as ActionCenterItem["status"],
    title: row.title,
    description: row.description,
    expectedAmount: row.expected_amount,
    invoicedAmount: row.invoiced_amount,
    missingAmount: row.missing_amount,
    leakageStatus: row.leakage_status as ActionCenterItem["leakageStatus"],
    leakageReason: row.leakage_reason as ActionCenterItem["leakageReason"],
    eventLogId: row.event_log_id ?? undefined,
    billableInstanceId: row.billable_instance_id ?? undefined,
    invoicePeriodStart: row.invoice_period_start ?? undefined,
    invoicePeriodEnd: row.invoice_period_end ?? undefined,
  }
}
