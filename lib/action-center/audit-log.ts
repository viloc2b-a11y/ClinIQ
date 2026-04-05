import { getActionCenterAuditStore } from "./audit/store/get-store"
import type { ActionCenterAuditEntry } from "./audit/store/types"

export type { ActionCenterAuditEntry } from "./audit/store/types"

export async function appendAudit(entry: ActionCenterAuditEntry): Promise<void> {
  const store = getActionCenterAuditStore()
  await store.append(entry)
}

export async function getAuditLog(): Promise<ActionCenterAuditEntry[]> {
  const store = getActionCenterAuditStore()
  return store.list()
}

export async function resetAuditLog(): Promise<void> {
  const store = getActionCenterAuditStore()
  await store.reset()
}
