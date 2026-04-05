import { getFeatureFlags } from "../../../config/feature-flags"
import { MemoryOperationEnvelopeStore } from "./memory-operation-envelope-store"
import { SupabaseOperationEnvelopeStore } from "./supabase-operation-envelope-store"
import type { OperationEnvelopeStore } from "./types"

let cachedStore: OperationEnvelopeStore | null = null

export function getOperationEnvelopeStore(): OperationEnvelopeStore {
  if (cachedStore) {
    return cachedStore
  }

  const flags = getFeatureFlags()

  if (flags.enableRealEnvelopeStore) {
    cachedStore = new SupabaseOperationEnvelopeStore()
    return cachedStore
  }

  cachedStore = new MemoryOperationEnvelopeStore()
  return cachedStore
}

export function resetOperationEnvelopeStoreCache(): void {
  cachedStore = null
}
