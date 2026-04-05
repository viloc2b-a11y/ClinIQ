/**
 * Action Center persistence mode — **STEP 1 cutover entry**.
 * Default: `memory`. Supabase only when env is exactly `supabase` (trimmed, case-insensitive).
 * No auto-detection from `NEXT_PUBLIC_SUPABASE_URL` or other signals; explicit opt-in only.
 * When using Supabase, URL + service role must be configured separately (see `.env.example`).
 *
 * **STEP 11 non-goals** (scope guardrails): `.cursor/rules/action-center-step11-non-goals.mdc`.
 */
export type ActionCenterPersistenceMode = "memory" | "supabase"

export function getActionCenterPersistenceMode(): ActionCenterPersistenceMode {
  const raw = process.env.CLINIQ_ACTION_CENTER_PERSISTENCE_MODE?.trim().toLowerCase()

  if (raw === "supabase") {
    return "supabase"
  }

  return "memory"
}

export function isSupabasePersistenceEnabled(): boolean {
  return getActionCenterPersistenceMode() === "supabase"
}
