import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Resolve the active (open) negotiation deal for a given site+study.
 * Falls back to user's primary site when siteId is omitted.
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studyKey = String(searchParams.get("studyKey") ?? "").trim() || "STUDY-1"
  const studyName = String(searchParams.get("studyName") ?? "").trim() || null
  let siteId = String(searchParams.get("siteId") ?? "").trim()

  if (!siteId) {
    try {
      siteId = (await ensureUserPrimarySite(supabase, user.id)).siteId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  }

  const { data: deal, error } = await supabase
    .from("negotiation_deals")
    .select("deal_id, site_id, study_key, study_name, status, version, last_updated_at, last_updated_by")
    .eq("site_id", siteId)
    .eq("study_key", studyKey)
    .eq("status", "open")
    .maybeSingle()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  if (deal) return NextResponse.json({ ok: true, deal })

  // Create an open deal if missing.
  const { data: created, error: insErr } = await supabase
    .from("negotiation_deals")
    .insert({
      user_id: user.id,
      site_id: siteId,
      study_key: studyKey,
      study_name: studyName,
      status: "open",
      version: 1,
      last_updated_by: user.id,
      last_updated_at: new Date().toISOString(),
    })
    .select("deal_id, site_id, study_key, study_name, status, version, last_updated_at, last_updated_by")
    .single()

  if (insErr || !created) {
    return NextResponse.json({ ok: false, error: insErr?.message ?? "Create deal failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deal: created })
}

