import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import {
  expectedBillableRowsFromDraftPayload,
  mapNegotiationItemsToExpectedBillableRows,
  type NegotiationItemRow,
} from "@/lib/study-publish/map-to-expected-billable-rows"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

type PublishBody = {
  source?: "draft" | "negotiation" | "final_agreement"
  draftVersionId?: string
  dealId?: string
  agreementId?: string
  expectedVersion?: number
  siteId?: string
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

/**
 * Replace published baseline expected_billables for (site_id, study_key).
 * Rows with event_log_id set are left untouched (event-linked copies).
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

  let body: PublishBody
  try {
    body = (await req.json()) as PublishBody
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const source = body.source
  if (source !== "draft" && source !== "negotiation" && source !== "final_agreement") {
    return NextResponse.json(
      { ok: false, error: "source must be draft | negotiation | final_agreement" },
      { status: 400 },
    )
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
      return NextResponse.json({ ok: false, error: "Forbidden: not a member of that site" }, { status: 403 })
    }
  }

  let studyKey = ""
  let rows = [] as ReturnType<typeof expectedBillableRowsFromDraftPayload>
  let dealVersionUsed: number | null = null

  if (source === "draft") {
    const id = asString(body.draftVersionId).trim()
    if (!id) return NextResponse.json({ ok: false, error: "draftVersionId required" }, { status: 400 })

    const { data: draft, error: dErr } = await supabase
      .from("cliniq_budget_draft_versions")
      .select("id, user_id, site_id, study_key, internal_lines, sponsor_lines")
      .eq("id", id)
      .maybeSingle()

    if (dErr) return NextResponse.json({ ok: false, error: dErr.message }, { status: 500 })
    if (!draft || (draft as { user_id?: string }).user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "Draft not found" }, { status: 404 })
    }
    const d = draft as {
      site_id: string
      study_key: string
      internal_lines: unknown
      sponsor_lines: unknown
    }
    if (d.site_id !== siteId) {
      return NextResponse.json({ ok: false, error: "Draft site does not match siteId" }, { status: 403 })
    }
    studyKey = String(d.study_key ?? "").trim() || "STUDY-1"
    rows = expectedBillableRowsFromDraftPayload({
      siteId,
      studyKey,
      internal_lines: d.internal_lines,
      sponsor_lines: d.sponsor_lines,
    })
  } else if (source === "negotiation") {
    const dealId = asString(body.dealId).trim()
    if (!dealId) return NextResponse.json({ ok: false, error: "dealId required" }, { status: 400 })

    const expectedVersion =
      typeof body.expectedVersion === "number" && Number.isFinite(body.expectedVersion)
        ? body.expectedVersion
        : null
    if (expectedVersion === null) {
      return NextResponse.json({ ok: false, error: "expectedVersion is required for negotiation publish" }, { status: 400 })
    }

    const { data: deal, error: dealErr } = await supabase
      .from("negotiation_deals")
      .select("deal_id, site_id, study_key, version")
      .eq("deal_id", dealId)
      .maybeSingle()

    if (dealErr) return NextResponse.json({ ok: false, error: dealErr.message }, { status: 500 })
    if (!deal || (deal as { site_id?: string }).site_id !== siteId) {
      return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 })
    }
    const v = (deal as { version?: number }).version
    if (typeof v !== "number" || v !== expectedVersion) {
      return NextResponse.json(
        { ok: false, error: "Conflict: deal version mismatch", conflict: { expectedVersion, current: v } },
        { status: 409 },
      )
    }

    studyKey = String((deal as { study_key?: string }).study_key ?? "").trim() || "STUDY-1"
    dealVersionUsed = v

    const { data: itemRows, error: itemErr } = await supabase
      .from("negotiation_items")
      .select(
        "source_line_id, line_code, label, category, visit_name, quantity, unit, proposed_price, current_price, status",
      )
      .eq("deal_id", dealId)

    if (itemErr) return NextResponse.json({ ok: false, error: itemErr.message }, { status: 500 })
    rows = mapNegotiationItemsToExpectedBillableRows((itemRows ?? []) as NegotiationItemRow[], siteId, studyKey)
  } else {
    const agreementId = asString(body.agreementId).trim()
    if (!agreementId) return NextResponse.json({ ok: false, error: "agreementId required" }, { status: 400 })

    const { data: fa, error: faErr } = await supabase
      .from("final_agreements")
      .select("id, site_id, study_key, snapshot, user_id")
      .eq("id", agreementId)
      .maybeSingle()

    if (faErr) return NextResponse.json({ ok: false, error: faErr.message }, { status: 500 })
    if (!fa || (fa as { user_id?: string }).user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "Agreement not found" }, { status: 404 })
    }
    if ((fa as { site_id?: string }).site_id !== siteId) {
      return NextResponse.json({ ok: false, error: "Agreement site does not match siteId" }, { status: 403 })
    }

    studyKey = String((fa as { study_key?: string }).study_key ?? "").trim() || "STUDY-1"
    const snap = (fa as { snapshot?: { items?: NegotiationItemRow[] } }).snapshot
    const items = Array.isArray(snap?.items) ? snap!.items! : []
    rows = mapNegotiationItemsToExpectedBillableRows(items, siteId, studyKey)
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No lines to publish — check draft lines or negotiation items" },
      { status: 400 },
    )
  }

  const { error: delErr } = await supabase
    .from("expected_billables")
    .delete()
    .eq("site_id", siteId)
    .eq("study_key", studyKey)
    .is("event_log_id", null)

  if (delErr) {
    return NextResponse.json({ ok: false, error: "Failed to clear prior publish: " + delErr.message }, { status: 500 })
  }

  const { error: insErr } = await supabase.from("expected_billables").insert(rows)
  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    siteId,
    studyKey,
    publishedCount: rows.length,
    source,
    dealVersion: dealVersionUsed,
  })
}
