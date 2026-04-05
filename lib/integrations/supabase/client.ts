import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

/**
 * Server-side client when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set.
 * Returns null if misconfigured (safe fallback for tests and local dev).
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim() ?? ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""

  if (!url || !key) {
    return null
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return client
}

/** Clears cached client (tests only). */
export function resetSupabaseClientCache(): void {
  client = null
}
