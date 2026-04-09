import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

type CloseBody = {
  dealId?: string
  siteId?: string
  studyKey?: string
  studyName?: string | null
  engineInput?: unknown
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: CloseBody
  try {
    body = (await req.json()) as CloseBody
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const dealId = String(body.dealId ?? "").trim()
  if (!dealId) return NextResponse.json({ ok: false, error: "Missing dealId" }, { status: 400 })

  const studyKey = String(body.studyKey ?? "").trim() || "STUDY-1"
  const studyName = body.studyName === null ? null : String(body.studyName ?? "").trim() || null

  let siteId = String(body.siteId ?? "").trim()
  if (!siteId) {
    try {
      siteId = (await ensureUserPrimarySite(supabase, user.id)).siteId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  } else {
    const { data: membership, error: memErr } = await supabase
      .from("cliniq_site_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("site_id", siteId)
      .maybeSingle()
    if (memErr) return NextResponse.json({ ok: false, error: memErr.message }, { status: 500 })
    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: you are not a member of that site" },
        { status: 403 },
      )
    }
  }

  const { data, error } = await supabase.rpc("close_negotiation_deal_atomic", {
    p_deal_id: dealId,
    p_site_id: siteId,
    p_study_key: studyKey,
    p_study_name: studyName,
    p_engine_input: body.engineInput ?? null,
  })

  if (error) {
    const msg = error.message ?? "Close failed"
    if (msg.includes("not_found:deal")) return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 })
    if (msg.includes("conflict:already_closed")) return NextResponse.json({ ok: false, error: "Conflict: deal already closed" }, { status: 409 })
    if (msg.includes("unauthorized")) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    if (msg.includes("forbidden")) return NextResponse.json({ ok: false, error: "Forbidden: you are not a member of that site" }, { status: 403 })
    if (msg.includes("invalid_input")) return NextResponse.json({ ok: false, error: msg }, { status: 400 })
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  const row = Array.isArray(data) ? data[0] : (data as any)
  if (!row?.agreement_id) {
    return NextResponse.json({ ok: false, error: "Close failed" }, { status: 500 })
  }
  const agreement = row?.agreement_id ? { id: row.agreement_id, closed_at: row.closed_at } : null
  const financials = (row?.financials as any) ?? null
  return NextResponse.json({ ok: true, agreement, financials })
}

