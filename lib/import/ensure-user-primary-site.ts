import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Returns first site the user belongs to, or creates "Primary site" and membership (via DB trigger).
 */
export async function ensureUserPrimarySite(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ siteId: string }> {
  const { data: rows, error: memErr } = await supabase
    .from("cliniq_site_members")
    .select("site_id")
    .eq("user_id", userId)
    .limit(1)

  if (memErr) throw memErr
  const first = rows?.[0] as { site_id: string } | undefined
  if (first?.site_id) return { siteId: first.site_id }

  const { data: site, error: siteErr } = await supabase
    .from("cliniq_sites")
    .insert({ name: "Primary site", created_by: userId })
    .select("id")
    .single()

  if (siteErr) throw siteErr
  const id = (site as { id: string }).id
  return { siteId: id }
}
