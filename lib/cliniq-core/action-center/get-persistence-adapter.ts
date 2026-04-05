import type { ActionCenterPersistenceAdapter } from "./persistence-adapter"
import { createMemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { createSupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import { isSupabasePersistenceEnabled } from "./persistence-config"

let memoryAdapter: ActionCenterPersistenceAdapter | null = null

/** Replaces the cached memory adapter (e.g. after bootstrap seeding). */
export function setMemoryPersistenceAdapter(adapter: ActionCenterPersistenceAdapter): void {
  memoryAdapter = adapter
}

/** Clears cached memory adapter (tests). Supabase path is unaffected. */
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
