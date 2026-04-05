import type { ActionCenterItem } from "./types"
import type { ActionCenterRowActionDefinition } from "./row-actions"

export interface ActionCenterDetailView {
  item: ActionCenterItem
  rowActions: ActionCenterRowActionDefinition[]
  facts: {
    studyId: string
    sponsorId?: string
    subjectId: string
    visitName: string
    lineCode: string
    expectedAmount: number
    invoicedAmount: number
    missingAmount: number
    ownerRole: string
    priority: string
    status: string
    leakageStatus: string
    leakageReason: string
    eventLogId?: string
    billableInstanceId?: string
    invoicePeriodStart?: string
    invoicePeriodEnd?: string
  }
}
