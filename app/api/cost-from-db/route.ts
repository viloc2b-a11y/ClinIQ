export const dynamic = 'force-dynamic'

import { createClient } from "@supabase/supabase-js"
import { calculateProcedureCost } from "@/lib/cliniq-core/cost-truth/cost-engine"
import type {
  Procedure,
  RoleCost,
  SiteCostProfile,
} from "@/lib/cliniq-core/cost-truth/cost-types"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
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
    const { data: procedureRow } = await supabase
      .from("procedures_master")
      .select("*")
      .eq("id", procedureId)
      .single()

    // 2. Times
    const { data: timesRows } = await supabase
      .from("procedure_time")
      .select("*")
      .eq("procedure_id", procedureId)

    // 3. Conditions
    const { data: conditionRows } = await supabase
      .from("procedure_conditions")
      .select("*")
      .eq("procedure_id", procedureId)

    // 4. Role costs
    const { data: roleCostRows } = await supabase
      .from("role_costs")
      .select("*")
      .eq("active", true)

    // 5. Site profile
    const { data: siteProfileRow } = await supabase
      .from("site_cost_profiles")
      .select("*")
      .eq("id", siteProfileId)
      .single()

    if (!procedureRow) {
      throw new Error("Procedure not found")
    }

    if (!siteProfileRow) {
      throw new Error("Site profile not found")
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
      { status: 400 }
    )
  }
}