import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { computeNegotiationFinancialSummary } from "@/lib/negotiation/financial"
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

  const { data: items, error: itemErr } = await supabase
    .from("negotiation_items")
    .select(
      "source_line_id, line_code, label, category, visit_name, quantity, unit, current_price, internal_cost, proposed_price, justification, status, updated_at",
    )
    .eq("deal_id", dealId)

  if (itemErr) return NextResponse.json({ ok: false, error: itemErr.message }, { status: 500 })

  const safeItems =
    (items ?? []) as {
      source_line_id: string
      line_code: string
      label: string
      category: string
      visit_name: string
      quantity: number
      unit: string
      current_price: number
      internal_cost: number
      proposed_price: number
      justification: string
      status: "pending" | "accepted" | "rejected"
      updated_at: string
    }[]

  const summary = computeNegotiationFinancialSummary(
    safeItems.map((it) => ({
      current_price: it.current_price,
      internal_cost: it.internal_cost,
      proposed_price: it.proposed_price,
      status: it.status,
    })),
  )

  const snapshot = {
    dealId,
    siteId,
    studyKey,
    studyName,
    closedAt: new Date().toISOString(),
    closedBy: user.id,
    financials: summary,
    items: safeItems,
    engineInput: body.engineInput ?? null,
  }

  // Audit snapshot (close-history) before writing final agreement.
  const { error: snapErr } = await supabase.from("negotiation_round_snapshots").insert({
    deal_id: dealId,
    user_id: user.id,
    site_id: siteId,
    study_key: studyKey,
    study_name: studyName,
    kind: "close",
    financials: summary,
    items: safeItems,
  })
  if (snapErr) {
    return NextResponse.json({ ok: false, error: snapErr.message }, { status: 500 })
  }

  // Mark deal as closed and bump version (best-effort; deal may not exist in older deployments).
  const { data: closedDeal, error: closeErr } = await supabase
    .from("negotiation_deals")
    .update({
      status: "closed",
      last_updated_at: new Date().toISOString(),
      last_updated_by: user.id,
    })
    .eq("deal_id", dealId)
    .select("deal_id")
    .maybeSingle()
  if (closeErr) {
    return NextResponse.json({ ok: false, error: closeErr.message }, { status: 500 })
  }
  if (!closedDeal) {
    return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 })
  }

  const { data: inserted, error: insErr } = await supabase
    .from("final_agreements")
    .insert({
      deal_id: dealId,
      user_id: user.id,
      site_id: siteId,
      study_key: studyKey,
      study_name: studyName,
      total_sponsor: summary.total_sponsor,
      total_internal: summary.total_internal,
      total_target: summary.total_target,
      upside: summary.upside,
      margin: summary.margin,
      closed_by: user.id,
      snapshot,
    })
    .select("id, closed_at")
    .single()

  if (insErr || !inserted) {
    return NextResponse.json({ ok: false, error: insErr?.message ?? "Close failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, agreement: inserted, financials: summary })
}

