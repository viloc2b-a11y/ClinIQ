export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import { calculateProcedureCost } from "@/lib/cliniq-core/cost-truth/cost-engine"
import type {
  Procedure,
  RoleCost,
  SiteCostProfile,
} from "@/lib/cliniq-core/cost-truth/cost-types"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.")
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.")
  }

  return createClient(url, serviceKey)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)

    const procedureId = searchParams.get("procedure_id")
    const siteProfileId = searchParams.get("site_profile_id")

    if (!procedureId) {
      return Response.json(
        { ok: false, error: "procedure_id is required" },
        { status: 400 }
      )
    }

    if (!siteProfileId) {
      return Response.json(
        { ok: false, error: "site_profile_id is required" },
        { status: 400 }
      )
    }

    // 1. Procedure
    const { data: procedureRow, error: procErr } = await supabase
      .from("procedures_master")
      .select("*")
      .eq("id", procedureId)
      .single()
    if (procErr) {
      return Response.json({ ok: false, error: procErr.message }, { status: 500 })
    }

    // 2. Times
    const { data: timesRows, error: timesErr } = await supabase
      .from("procedure_time")
      .select("*")
      .eq("procedure_id", procedureId)
    if (timesErr) {
      return Response.json({ ok: false, error: timesErr.message }, { status: 500 })
    }

    // 3. Conditions
    const { data: conditionRows, error: condErr } = await supabase
      .from("procedure_conditions")
      .select("*")
      .eq("procedure_id", procedureId)
    if (condErr) {
      return Response.json({ ok: false, error: condErr.message }, { status: 500 })
    }

    // 4. Role costs
    const { data: roleCostRows, error: roleErr } = await supabase
      .from("role_costs")
      .select("*")
      .eq("active", true)
    if (roleErr) {
      return Response.json({ ok: false, error: roleErr.message }, { status: 500 })
    }

    // 5. Site profile
    const { data: siteProfileRow, error: siteErr } = await supabase
      .from("site_cost_profiles")
      .select("*")
      .eq("id", siteProfileId)
      .single()
    if (siteErr) {
      return Response.json({ ok: false, error: siteErr.message }, { status: 500 })
    }

    if (!procedureRow) {
      return Response.json({ ok: false, error: "Procedure not found" }, { status: 404 })
    }

    if (!siteProfileRow) {
      return Response.json({ ok: false, error: "Site profile not found" }, { status: 404 })
    }

    // Map to engine types

    const procedure: Procedure = {
      id: procedureRow.id,
      name: procedureRow.name,
      times:
        timesRows?.map((t) => ({
          role_code: t.role_code,
          minutes: Number(t.minutes),
        })) ?? [],
      conditions:
        conditionRows?.map((c) => ({
          probability: Number(c.probability),
          cost_impact: Number(c.cost_impact),
        })) ?? [],
    }

    const roleCosts: RoleCost[] =
      roleCostRows?.map((r) => ({
        role_code: r.role_code,
        hourly_cost: Number(r.hourly_cost),
      })) ?? []

    const siteCostProfile: SiteCostProfile = {
      overhead_percent: Number(siteProfileRow.overhead_percent),
      margin_target: Number(siteProfileRow.margin_target),
    }

    const result = calculateProcedureCost(
      procedure,
      roleCosts,
      siteCostProfile
    )

    return Response.json({
      ok: true,
      procedure,
      result,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error"

    return Response.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
