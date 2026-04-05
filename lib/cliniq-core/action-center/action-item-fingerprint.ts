import type { ActionCenterItem } from "./types"

/**
 * Operational / workflow fields (e.g. status) are intentionally excluded so sync can
 * refresh facts without clobbering user progress.
 */
function materialRecord(item: ActionCenterItem): Record<string, string | number> {
  return {
    actionType: item.actionType,
    billableInstanceId: item.billableInstanceId ?? "",
    description: item.description,
    eventLogId: item.eventLogId ?? "",
    expectedAmount: item.expectedAmount,
    id: item.id,
    invoicePeriodEnd: item.invoicePeriodEnd ?? "",
    invoicePeriodStart: item.invoicePeriodStart ?? "",
    invoicedAmount: item.invoicedAmount,
    leakageReason: item.leakageReason,
    leakageStatus: item.leakageStatus,
    lineCode: item.lineCode,
    missingAmount: item.missingAmount,
    ownerRole: item.ownerRole,
    priority: item.priority,
    sponsorId: item.sponsorId ?? "",
    studyId: item.studyId,
    subjectId: item.subjectId,
    title: item.title,
    visitName: item.visitName,
  }
}

export function buildActionItemFingerprint(item: ActionCenterItem): string {
  return JSON.stringify(materialRecord(item))
}

export function areActionItemsEquivalent(a: ActionCenterItem, b: ActionCenterItem): boolean {
  return buildActionItemFingerprint(a) === buildActionItemFingerprint(b)
}
