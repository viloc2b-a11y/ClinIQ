/**
 * Resolves an {@link ActionCenterPersistenceAdapter} for controlled boundary writes.
 * No Supabase client construction unless the real adapter path is selected (delegates to existing factory).
 */

import type { ActionCenterPersistenceAdapter } from "./persistence-adapter"
import { MemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { createSupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import { isSupabasePersistenceEnabled } from "./persistence-config"
import { isActionCenterPersistenceEnabled } from "./persistence-feature-flag"

export const RESOLVE_ADAPTER_ERROR = {
  /** `ENABLE_ACTION_CENTER_PERSISTENCE=true` but Action Center is not in Supabase mode. */
  requiresSupabaseMode: "action_center_real_persistence_requires_supabase_mode",
} as const

/**
 * - Flag off → new {@link MemoryPersistenceAdapter} (shared in-memory store per existing implementation).
 * - Flag on → {@link createSupabasePersistenceAdapter} only when `CLINIQ_ACTION_CENTER_PERSISTENCE_MODE=supabase`; otherwise throws.
 */
export function resolveActionCenterPersistenceAdapter(): ActionCenterPersistenceAdapter {
  if (!isActionCenterPersistenceEnabled()) {
    return new MemoryPersistenceAdapter()
  }

  if (!isSupabasePersistenceEnabled()) {
    throw new Error(RESOLVE_ADAPTER_ERROR.requiresSupabaseMode)
  }

  return createSupabasePersistenceAdapter()
}
