import { getFeatureFlags } from "../../config/feature-flags"
import { buildActionCenterHealthSnapshot } from "./build-health-snapshot"
import type { ActionCenterHealthSnapshot } from "./types"

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export async function readActionCenterHealthSnapshot(): Promise<ActionCenterHealthSnapshot> {
  const flags = getFeatureFlags()

  return buildActionCenterHealthSnapshot({
    flags,
    supabaseConfigured: isSupabaseConfigured(),
  })
}
