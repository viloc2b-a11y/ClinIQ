import { MemoryActionCenterMetricsStore } from "./memory-metrics-store"
import type { ActionCenterMetricsStore } from "./types"

let cachedStore: ActionCenterMetricsStore | null = null

export function getActionCenterMetricsStore(): ActionCenterMetricsStore {
  if (!cachedStore) {
    cachedStore = new MemoryActionCenterMetricsStore()
  }

  return cachedStore
}

export function resetActionCenterMetricsStoreCache(): void {
  cachedStore = null
}
