import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

type Phase = "draft" | "negotiating" | "active" | "closeout"

type DashboardRow = {
  study_key: string
  phase: Phase
  upside: number
  expected_revenue: number
  billed_revenue: number
  collected_revenue: number
  at_risk_revenue: number
  closeout_exposure: number
  next_action: string
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { siteId } = await ensureUserPrimarySite(supabase, user.id)

  const { data, error } = await supabase
    .from("vw_dashboard_portfolio_rows")
    .select(
      "study_key, phase, upside, expected_revenue, billed_revenue, collected_revenue, at_risk_revenue, closeout_unbilled, closeout_uncollected, closeout_open_packages, closeout_readiness_pct",
    )
    .eq("site_id", siteId)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const rows = ((data ?? []) as any[]).map((r) => {
    const phase = (String(r.phase ?? "draft") as Phase) ?? "draft"
    const closeoutExposure = num(r.closeout_unbilled) + num(r.closeout_uncollected)
    const atRisk = num(r.at_risk_revenue)
    const upside = num(r.upside)

    const nextAction =
      phase === "draft"
        ? "Upload budget & CTA"
        : phase === "negotiating"
          ? upside > 0
            ? "Review counteroffer"
            : "Complete negotiation inputs"
          : phase === "closeout"
            ? "Prepare closeout package"
            : atRisk > 0
              ? "Recover missing revenue"
              : "Review study"

    const row: DashboardRow = {
      study_key: String(r.study_key ?? "—"),
      phase,
      upside,
      expected_revenue: num(r.expected_revenue),
      billed_revenue: num(r.billed_revenue),
      collected_revenue: num(r.collected_revenue),
      at_risk_revenue: atRisk,
      closeout_exposure: closeoutExposure,
      next_action: nextAction,
    }
    return row
  })

  // KPIs
  const activeStudies = rows.filter((r) => r.phase !== "draft").length
  const negotiationUpside = rows.reduce((s, r) => s + (r.phase === "negotiating" ? r.upside : 0), 0)
  const expectedRevenue = rows.reduce((s, r) => s + (r.phase === "active" ? r.expected_revenue : 0), 0)
  const atRiskRevenue = rows.reduce((s, r) => s + (r.phase === "active" ? r.at_risk_revenue : 0), 0)
  const closeoutExposure = rows.reduce((s, r) => s + (r.phase === "closeout" ? r.closeout_exposure : 0), 0)

  const phaseCounts = rows.reduce(
    (acc, r) => {
      acc[r.phase] = (acc[r.phase] ?? 0) + 1
      return acc
    },
    {} as Record<Phase, number>,
  )

  // Needs attention: top by at-risk, then by upside, then by closeout exposure
  const needsAttention = [...rows]
    .map((r) => ({
      ...r,
      attention_score: r.at_risk_revenue * 10 + r.upside * 2 + r.closeout_exposure * 5,
    }))
    .sort((a, b) => b.attention_score - a.attention_score)
    .slice(0, 5)
    .map(({ attention_score, ...rest }) => rest)

  return NextResponse.json({
    ok: true,
    data: {
      site_id: siteId,
      kpis: {
        active_studies: activeStudies,
        negotiation_upside: negotiationUpside,
        expected_revenue: expectedRevenue,
        revenue_at_risk: atRiskRevenue,
        closeout_exposure: closeoutExposure,
      },
      phase_distribution: phaseCounts,
      portfolio_rows: rows,
      needs_attention: needsAttention,
    },
  })
}

