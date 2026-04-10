import { ensureUserPrimarySite } from "@/lib/import/ensure-user-primary-site"
import { createServerSupabaseClient } from "@/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

type PortfolioRow = {
  study_key: string
  phase: "draft" | "negotiating" | "active" | "closeout"
  agreement_closed_at: string | null
  total_sponsor: number | null
  total_target: number | null
  upside: number | null
  expected_revenue: number | null
  billed_revenue: number | null
  collected_revenue: number | null
  missing_revenue: number | null
  closeout_exposure: number | null
  closeout_readiness_pct: number | null
  next_action: string
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { siteId } = await ensureUserPrimarySite(supabase, user.id)

  const [{ data: base, error: baseErr }, { data: ev, error: evErr }, { data: co, error: coErr }] =
    await Promise.all([
      supabase
        .from("vw_portfolio_studies")
        .select("study_key, phase, agreement_closed_at, total_sponsor, total_target, upside")
        .eq("site_id", siteId),
      supabase
        .from("vw_study_expected_vs_actual")
        .select("study_key, expected_revenue, billed_revenue, collected_revenue, missing_revenue")
        .eq("site_id", siteId),
      supabase
        .from("vw_study_closeout_rollup")
        .select("study_key, unbilled_amount, uncollected_amount, readiness_pct")
        .eq("site_id", siteId),
    ])

  const err = baseErr ?? evErr ?? coErr
  if (err) return NextResponse.json({ ok: false, error: err.message }, { status: 500 })

  const byStudy = new Map<string, any>()
  for (const r of base ?? []) byStudy.set(String((r as any).study_key ?? ""), r)
  const evBy = new Map<string, any>()
  for (const r of ev ?? []) evBy.set(String((r as any).study_key ?? ""), r)
  const coBy = new Map<string, any>()
  for (const r of co ?? []) coBy.set(String((r as any).study_key ?? ""), r)

  const mapped: PortfolioRow[] = Array.from(byStudy.entries())
    .filter(([k]) => k && k !== "—")
    .map(([studyKey, r]) => {
      const e = evBy.get(studyKey)
      const c = coBy.get(studyKey)
      const expected = Number(e?.expected_revenue ?? 0) || 0
      const billed = Number(e?.billed_revenue ?? 0) || 0
      const collected = Number(e?.collected_revenue ?? 0) || 0
      const missing = Number(e?.missing_revenue ?? Math.max(0, expected - billed)) || 0
      const upside = r.upside == null ? null : (Number(r.upside) || 0)
      const closeoutExposure = (Number(c?.unbilled_amount ?? 0) || 0) + (Number(c?.uncollected_amount ?? 0) || 0)
      const readinessPct = c?.readiness_pct == null ? null : (Number(c.readiness_pct) || 0)

      const phase = (String(r.phase ?? "draft") as PortfolioRow["phase"]) ?? "draft"
      const nextAction =
        phase === "draft"
          ? "Upload budget & CTA"
          : phase === "negotiating"
            ? "Review counteroffer"
            : phase === "closeout"
              ? "Prepare closeout package"
              : missing > 0
                ? "Recover missing revenue"
                : "Review study"

      return {
        study_key: studyKey,
        phase,
        agreement_closed_at: r.agreement_closed_at ?? null,
        total_sponsor: r.total_sponsor == null ? null : (Number(r.total_sponsor) || 0),
        total_target: r.total_target == null ? null : (Number(r.total_target) || 0),
        upside,
        expected_revenue: expected,
        billed_revenue: billed,
        collected_revenue: collected,
        missing_revenue: missing,
        closeout_exposure: closeoutExposure,
        closeout_readiness_pct: readinessPct,
        next_action: nextAction,
      }
    })

  mapped.sort((a, b) => {
    const phaseRank = (p: PortfolioRow["phase"]) =>
      p === "negotiating" ? 1 : p === "active" ? 2 : p === "closeout" ? 3 : 4
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

