import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

type PortfolioRow = {
  study_key: string
  phase: "draft" | "negotiating" | "active"
  agreement_closed_at: string | null
  total_sponsor: number | null
  total_target: number | null
  upside: number | null
  expected_revenue: number | null
  billed_revenue: number | null
  collected_revenue: number | null
  missing_revenue: number | null
  next_action: string
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { siteId } = await ensureUserPrimarySite(supabase, user.id)

  const { data, error } = await supabase
    .from("vw_portfolio_studies")
    .select(
      "study_key, phase, agreement_closed_at, total_sponsor, total_target, upside, vw_study_expected_vs_actual(expected_revenue, billed_revenue, collected_revenue, missing_revenue)",
    )
    .eq("site_id", siteId)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as any[]

  const mapped: PortfolioRow[] = rows.map((r) => {
    const ev = (r.vw_study_expected_vs_actual ?? null) as any
    const expected = Number(ev?.expected_revenue ?? 0) || 0
    const billed = Number(ev?.billed_revenue ?? 0) || 0
    const collected = Number(ev?.collected_revenue ?? 0) || 0
    const missing = Number(ev?.missing_revenue ?? Math.max(0, expected - billed)) || 0
    const upside = r.upside == null ? null : (Number(r.upside) || 0)

    const phase = (String(r.phase ?? "draft") as PortfolioRow["phase"]) ?? "draft"
    const nextAction =
      phase === "draft"
        ? "Upload budget & CTA"
        : phase === "negotiating"
          ? "Generate counteroffer"
          : missing > 0
            ? "Recover missing revenue"
            : "Review study"

    return {
      study_key: String(r.study_key ?? "—"),
      phase,
      agreement_closed_at: r.agreement_closed_at ?? null,
      total_sponsor: r.total_sponsor == null ? null : (Number(r.total_sponsor) || 0),
      total_target: r.total_target == null ? null : (Number(r.total_target) || 0),
      upside,
      expected_revenue: expected,
      billed_revenue: billed,
      collected_revenue: collected,
      missing_revenue: missing,
      next_action: nextAction,
    }
  })

  mapped.sort((a, b) => {
    const phaseRank = (p: PortfolioRow["phase"]) => (p === "negotiating" ? 1 : p === "active" ? 2 : 3)
    const dr = phaseRank(a.phase) - phaseRank(b.phase)
    if (dr !== 0) return dr
    const up = (b.upside ?? 0) - (a.upside ?? 0)
    if (up !== 0) return up
    const miss = (b.missing_revenue ?? 0) - (a.missing_revenue ?? 0)
    if (miss !== 0) return miss
    return a.study_key.localeCompare(b.study_key)
  })

  return NextResponse.json({ ok: true, data: { site_id: siteId, studies: mapped } })
}

