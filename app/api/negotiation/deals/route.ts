import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * List open negotiation deals for the coordinator's site + study (DB source of truth).
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studyKey = String(searchParams.get("studyKey") ?? "").trim() || "STUDY-1"
  let siteId = String(searchParams.get("siteId") ?? "").trim()

  if (!siteId) {
    try {
      siteId = (await ensureUserPrimarySite(supabase, user.id)).siteId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from("negotiation_deals")
    .select("deal_id, site_id, study_key, study_name, status, version, last_updated_at")
    .eq("site_id", siteId)
    .eq("study_key", studyKey)
    .eq("status", "open")
    .order("last_updated_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deals: data ?? [], siteId })
}
