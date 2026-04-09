import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  // Closed deals: authoritative from final_agreements
  const { data: closed, error: closedErr } = await supabase
    .from("final_agreements")
    .select("deal_id, upside, margin, closed_at")
    .eq("user_id", user.id)

  if (closedErr) {
    return NextResponse.json({ ok: false, error: closedErr.message }, { status: 500 })
  }

  // Open deals: any deal_id present in negotiation_items, excluding those in final_agreements
  const { data: openIds, error: openErr } = await supabase
    .from("negotiation_items")
    .select("deal_id")
    .eq("user_id", user.id)

  if (openErr) {
    return NextResponse.json({ ok: false, error: openErr.message }, { status: 500 })
  }

  const closedSet = new Set((closed ?? []).map((r) => (r as { deal_id: string }).deal_id))
  const openSet = new Set(
    (openIds ?? [])
      .map((r) => (r as { deal_id: string }).deal_id)
      .filter((id) => id && !closedSet.has(id)),
  )

  const closedRows = (closed ?? []) as { deal_id: string; upside: number; margin: number; closed_at: string }[]
  const closedCount = closedRows.length
  const openCount = openSet.size
  const upsideCaptured = closedRows.reduce((acc, r) => acc + (Number.isFinite(r.upside) ? r.upside : 0), 0)
  const avgMargin = closedCount
    ? closedRows.reduce((acc, r) => acc + (Number.isFinite(r.margin) ? r.margin : 0), 0) / closedCount
    : 0

  return NextResponse.json({
    ok: true,
    openDeals: openCount,
    closedDeals: closedCount,
    avgMargin,
    upsideCaptured,
  })
}

