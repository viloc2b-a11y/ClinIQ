import type { ActionCenterItem } from "./types"
import type { ActionCenterDetailView } from "./detail-types"
import { getRowActions } from "./row-actions"

export function buildActionCenterDetailView(item: ActionCenterItem): ActionCenterDetailView {
  return {
    item,
    rowActions: getRowActions({
      status: item.status,
      actionType: item.actionType,
    }),
    facts: {
      studyId: item.studyId,
      sponsorId: item.sponsorId,
      subjectId: item.subjectId,
      visitName: item.visitName,
      lineCode: item.lineCode,
      expectedAmount: item.expectedAmount,
      invoicedAmount: item.invoicedAmount,
      missingAmount: item.missingAmount,
      ownerRole: item.ownerRole,
      priority: item.priority,
      status: item.status,
      leakageStatus: item.leakageStatus,
      leakageReason: item.leakageReason,
      eventLogId: item.eventLogId,
      billableInstanceId: item.billableInstanceId,
      invoicePeriodStart: item.invoicePeriodStart,
      invoicePeriodEnd: item.invoicePeriodEnd,
    },
  }
}
