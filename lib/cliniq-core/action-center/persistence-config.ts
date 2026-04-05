/**
 * `CLINIQ_ACTION_CENTER_PERSISTENCE_MODE`: default is memory (any value other than
 * trimmed case-insensitive `supabase`). Supabase mode needs server URL + service role;
 * see `.env.example`.
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
