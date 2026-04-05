import { getFeatureFlags } from "../../../config/feature-flags"
import { MemoryActionCenterMetricsStore } from "./memory-metrics-store"
import { SupabaseActionCenterMetricsStore } from "./supabase-metrics-store"
import type { ActionCenterMetricsStore } from "./types"

let cachedStore: ActionCenterMetricsStore | null = null

export function getActionCenterMetricsStore(): ActionCenterMetricsStore {
  if (cachedStore) {
    return cachedStore
  }

  const flags = getFeatureFlags()

  if (flags.enableRealMetricsStore) {
    cachedStore = new SupabaseActionCenterMetricsStore()
    return cachedStore
  }

  cachedStore = new MemoryActionCenterMetricsStore()
  return cachedStore
}

export function resetActionCenterMetricsStoreCache(): void {
  cachedStore = null
}
