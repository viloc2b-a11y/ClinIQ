import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client for Auth Admin API (invite, etc.). Server-only.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Public site URL for invite / magic-link redirects (no trailing slash).
 */
export function getPublicAppUrl(): string {
  const explicit = process.env.CLINIQ_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`
  return ""
}
