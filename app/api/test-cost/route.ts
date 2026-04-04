import { calculateProcedureCost } from "@/lib/cliniq-core/cost-truth/cost-engine"
import type {
  Procedure,
  RoleCost,
  SiteCostProfile,
} from "@/lib/cliniq-core/cost-truth/cost-types"

type TestCostRequest = {
  procedure: Procedure
  roleCosts: RoleCost[]
  siteCostProfile: SiteCostProfile
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<TestCostRequest>

    if (!body.procedure) {
      return Response.json(
        { ok: false, error: "procedure is required" },
        { status: 400 }
      )
    }

    if (!body.roleCosts) {
      return Response.json(
        { ok: false, error: "roleCosts is required" },
        { status: 400 }
      )
    }

    if (!body.siteCostProfile) {
      return Response.json(
        { ok: false, error: "siteCostProfile is required" },
        { status: 400 }
      )
    }

    const result = calculateProcedureCost(
      body.procedure,
      body.roleCosts,
      body.siteCostProfile
    )

    return Response.json({
      ok: true,
      result,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error"

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    )
  }
}