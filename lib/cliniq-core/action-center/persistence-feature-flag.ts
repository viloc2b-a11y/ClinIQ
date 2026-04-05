/**
 * Document Engine / Action Center — explicit opt-in for real persistence from boundary writes.
 * Separate from {@link isSupabasePersistenceEnabled} (`CLINIQ_ACTION_CENTER_PERSISTENCE_MODE`): both must align for Supabase.
 */

const ENV_KEY = "ENABLE_ACTION_CENTER_PERSISTENCE"

/** `true` only when env is exactly `true` (trimmed, case-insensitive). Default: off. */
export function isActionCenterPersistenceEnabled(): boolean {
  const raw = process.env[ENV_KEY]?.trim().toLowerCase()
  return raw === "true"
}
