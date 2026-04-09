import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { computeNegotiationFinancialSummary, stableNegotiationLineKey } from "@/lib/negotiation/financial"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

type NegotiationItemUpsert = {
  dealId: string
  siteId?: string
  studyKey?: string
  studyName?: string | null
  expectedVersion?: number
  stableKey?: string
  sourceLineId: string
  lineCode: string
  label: string
  category: string
  visitName: string
  quantity: number
  unit: string
  currentPrice: number
  internalCost: number
  proposedPrice: number
  justification: string
  status: "pending" | "accepted" | "rejected"
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function isStatus(v: unknown): v is "pending" | "accepted" | "rejected" {
  return v === "pending" || v === "accepted" || v === "rejected"
}

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dealId = searchParams.get("dealId")?.trim()
  if (!dealId) {
    return NextResponse.json({ ok: false, error: "Missing dealId" }, { status: 400 })
  }

  const { data: dealMeta, error: dealErr } = await supabase
    .from("negotiation_deals")
    .select("deal_id, version, last_updated_at, last_updated_by, status")
    .eq("deal_id", dealId)
    .maybeSingle()

  if (dealErr) {
    return NextResponse.json({ ok: false, error: dealErr.message }, { status: 500 })
  }

  const { data: rows, error } = await supabase
    .from("negotiation_items")
    .select(
      "id, deal_id, site_id, study_key, study_name, stable_key, source_line_id, line_code, label, category, visit_name, quantity, unit, current_price, internal_cost, proposed_price, justification, status, updated_at",
    )
    .eq("deal_id", dealId)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, items: rows ?? [], deal: dealMeta ?? null })
}

/**
 * Replace-all upsert for a deal.
 * Client sends full rows; server forces user_id and validates site membership.
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    dealId?: string
    siteId?: string
    studyKey?: string
    studyName?: string | null
    expectedVersion?: number
    items?: unknown
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const dealId = asString(body.dealId).trim()
  if (!dealId) return NextResponse.json({ ok: false, error: "Missing dealId" }, { status: 400 })

  const studyKey = asString(body.studyKey).trim() || "STUDY-1"
  const studyName = body.studyName === null ? null : asString(body.studyName).trim() || null
  const expectedVersion = Number.isFinite(body.expectedVersion) ? Number(body.expectedVersion) : null
  if (expectedVersion === null) {
    return NextResponse.json({ ok: false, error: "expectedVersion is required" }, { status: 400 })
  }

  let siteId = asString(body.siteId).trim()
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

  const rawItems = Array.isArray(body.items) ? (body.items as unknown[]) : null
  if (!rawItems) {
    return NextResponse.json({ ok: false, error: "Missing items[]" }, { status: 400 })
  }

  // Concurrency gate: deal version must match expectedVersion.
  const { data: deal, error: dealErr } = await supabase
    .from("negotiation_deals")
    .select("deal_id, version, last_updated_at, last_updated_by")
    .eq("deal_id", dealId)
    .maybeSingle()

  if (dealErr) return NextResponse.json({ ok: false, error: dealErr.message }, { status: 500 })
  const v = (deal as { version?: number } | null)?.version
  if (typeof v !== "number") return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 })
  if (v !== expectedVersion) {
    return NextResponse.json(
      {
        ok: false,
        error: "Conflict: deal changed since you loaded it",
        conflict: { expectedVersion, current: deal },
      },
      { status: 409 },
    )
  }

  const rows = rawItems.map((raw): Record<string, unknown> => {
    const it = raw as Partial<NegotiationItemUpsert>
    const status = it.status
    if (!isStatus(status)) throw new Error("Invalid status")

    const sourceLineId = asString(it.sourceLineId).trim()
    if (!sourceLineId) throw new Error("Missing sourceLineId")

    const stableKey =
      asString(it.stableKey).trim() ||
      stableNegotiationLineKey({
        lineCode: asString(it.lineCode),
        category: asString(it.category),
        visitName: asString(it.visitName),
        label: asString(it.label),
        unit: asString(it.unit),
      })

    return {
      deal_id: dealId,
      user_id: user.id,
      site_id: siteId,
      study_key: studyKey,
      study_name: studyName,
      stable_key: stableKey,
      source_line_id: sourceLineId,
      line_code: asString(it.lineCode).trim(),
      label: asString(it.label).trim(),
      category: asString(it.category).trim(),
      visit_name: asString(it.visitName).trim(),
      quantity: asNumber(it.quantity),
      unit: asString(it.unit).trim(),
      current_price: asNumber(it.currentPrice),
      internal_cost: asNumber(it.internalCost),
      proposed_price: asNumber(it.proposedPrice),
      justification: asString(it.justification),
      status,
      updated_at: new Date().toISOString(),
    }
  })

  try {
    const { error } = await supabase
      .from("negotiation_items")
      .upsert(rows, { onConflict: "deal_id,source_line_id" })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Audit snapshot (save-history).
    const financials = computeNegotiationFinancialSummary(
      rows.map((r) => ({
        current_price: Number(r.current_price) || 0,
        internal_cost: Number(r.internal_cost) || 0,
        proposed_price: Number(r.proposed_price) || 0,
        status: (r.status as "pending" | "accepted" | "rejected") ?? "pending",
      })),
    )
    const { error: snapErr } = await supabase.from("negotiation_round_snapshots").insert({
      deal_id: dealId,
      user_id: user.id,
      site_id: siteId,
      study_key: studyKey,
      study_name: studyName,
      kind: "save",
      financials,
      items: rows.map((r) => ({
        stable_key: r.stable_key,
        source_line_id: r.source_line_id,
        line_code: r.line_code,
        label: r.label,
        category: r.category,
        visit_name: r.visit_name,
        quantity: r.quantity,
        unit: r.unit,
        current_price: r.current_price,
        internal_cost: r.internal_cost,
        proposed_price: r.proposed_price,
        justification: r.justification,
        status: r.status,
      })),
    })
    if (snapErr) {
      return NextResponse.json({ ok: false, error: snapErr.message }, { status: 500 })
    }

    // Bump deal version + last_updated fields.
    const nextVersion = expectedVersion + 1

    const { data: bumped, error: bumpErr } = await supabase
      .from("negotiation_deals")
      .update({
        last_updated_at: new Date().toISOString(),
        last_updated_by: user.id,
        version: nextVersion,
      })
      .eq("deal_id", dealId)
      .eq("version", expectedVersion)
      .select("version, last_updated_at, last_updated_by")
      .maybeSingle()

    if (bumpErr) {
      return NextResponse.json({ ok: false, error: bumpErr.message }, { status: 500 })
    }
    if (!bumped) {
      return NextResponse.json({ ok: false, error: "Conflict: deal changed while saving" }, { status: 409 })
    }

    return NextResponse.json({ ok: true, siteId, deal: bumped ?? null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}

