/**
 * Adapter selection for Action Center — **STEP 1**: `isSupabasePersistenceEnabled()` → new Supabase adapter
 * each call; otherwise a single cached memory adapter. Rollback = unset `CLINIQ_ACTION_CENTER_PERSISTENCE_MODE`
 * or set to anything other than `supabase`.
 */
import type { ActionCenterPersistenceAdapter } from "./persistence-adapter"
import { createMemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { createSupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import { isSupabasePersistenceEnabled } from "./persistence-config"

let memoryAdapter: ActionCenterPersistenceAdapter | null = null

/** Clears cached memory adapter (tests / hot reload). Supabase path is unaffected. */
export function resetActionCenterPersistenceAdapterCache(): void {
  memoryAdapter = null
}

export function getActionCenterPersistenceAdapter(): ActionCenterPersistenceAdapter {
  if (isSupabasePersistenceEnabled()) {
    return createSupabasePersistenceAdapter()
  }

  if (!memoryAdapter) {
    memoryAdapter = createMemoryPersistenceAdapter()
  }

  return memoryAdapter
}
