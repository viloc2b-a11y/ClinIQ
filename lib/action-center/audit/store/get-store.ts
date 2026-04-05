import { getFeatureFlags } from "../../../config/feature-flags"
import { MemoryActionCenterAuditStore } from "./memory-audit-store"
import { SupabaseActionCenterAuditStore } from "./supabase-audit-store"
import type { ActionCenterAuditStore } from "./types"

let cachedStore: ActionCenterAuditStore | null = null

export function getActionCenterAuditStore(): ActionCenterAuditStore {
  if (cachedStore) {
    return cachedStore
  }

  const flags = getFeatureFlags()

  if (flags.enableRealAuditStore) {
    cachedStore = new SupabaseActionCenterAuditStore()
    return cachedStore
  }

  cachedStore = new MemoryActionCenterAuditStore()
  return cachedStore
}

export function resetActionCenterAuditStoreCache(): void {
  cachedStore = null
}
