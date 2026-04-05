import { getFeatureFlags } from "../../config/feature-flags"

import { MemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { SupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import type { ActionCenterPersistenceAdapter } from "./types"

let cachedMemoryAdapter: MemoryPersistenceAdapter | null = null

/** Clears cached memory adapter (tests / deterministic runs). */
export function resetPersistenceAdapterCache(): void {
  cachedMemoryAdapter = null
}

export function getPersistenceAdapter(): ActionCenterPersistenceAdapter {
  const flags = getFeatureFlags()

  if (flags.enableRealPersistence) {
    return new SupabasePersistenceAdapter()
  }

  if (!cachedMemoryAdapter) {
    cachedMemoryAdapter = new MemoryPersistenceAdapter()
  }

  return cachedMemoryAdapter
}
