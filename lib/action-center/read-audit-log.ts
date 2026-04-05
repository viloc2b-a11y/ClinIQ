import { getActionCenterAuditStore } from "./audit/store/get-store"
import type { AuditStoreListInput } from "./audit/store/types"

export async function readAuditLog(input: AuditStoreListInput = {}) {
  const store = getActionCenterAuditStore()
  return store.list(input)
}
