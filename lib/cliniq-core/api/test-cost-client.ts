/**
 * Client for `POST /api/test-cost` — default payloads match
 * `app/api/test-cost/route.ts` body: `{ procedure, roleCosts, siteCostProfile }`.
 */

import type { CostBreakdown, Procedure, RoleCost, SiteCostProfile } from "../cost-truth/cost-types"
import {
  CLINICAL_COST_SCREENING_DIABETES_EXAMPLE,
  clinicalRoleCostsToRoleCosts,
  clinicalSiteContextToSiteCostProfile,
} from "../fee-templates/clinical-cost-payload"

export type TestCostAPIPayload = {
  procedure: Procedure
  roleCosts: RoleCost[]
  siteCostProfile: SiteCostProfile
}

const DEFAULT_ROLE_COSTS = clinicalRoleCostsToRoleCosts(
  CLINICAL_COST_SCREENING_DIABETES_EXAMPLE.roleCosts,
)

const DEFAULT_SITE_PROFILE = clinicalSiteContextToSiteCostProfile(
  CLINICAL_COST_SCREENING_DIABETES_EXAMPLE.siteCostProfile,
)

function procedure(
  id: string,
  name: string,
  times: Procedure["times"],
): Procedure {
  return { id, name, times }
}

/** One `POST /api/test-cost` body per fee code. */
export const CLINIQ_DEFAULT_PAYLOADS: Record<string, TestCostAPIPayload> = {
  "PP-SCR-001": {
    procedure: procedure("PP-SCR-001", "Screening Visit (V1)", [
      { role_code: "CRC", minutes: 75 },
      { role_code: "PI", minutes: 15 },
      { role_code: "SubI", minutes: 30 },
      { role_code: "Lab", minutes: 25 },
      { role_code: "Admin", minutes: 15 },
    ]),
    roleCosts: DEFAULT_ROLE_COSTS,
    siteCostProfile: DEFAULT_SITE_PROFILE,
  },
  "PP-RAND-001": {
    procedure: procedure("PP-RAND-001", "Randomization / Baseline Visit", [
      { role_code: "CRC", minutes: 50 },
      { role_code: "PI", minutes: 12 },
      { role_code: "SubI", minutes: 20 },
      { role_code: "Lab", minutes: 30 },
      { role_code: "Admin", minutes: 12 },
    ]),
    roleCosts: DEFAULT_ROLE_COSTS,
    siteCostProfile: DEFAULT_SITE_PROFILE,
  },
  "PP-FUP-001": {
    procedure: procedure("PP-FUP-001", "Follow-up Visit", [
      { role_code: "CRC", minutes: 40 },
      { role_code: "PI", minutes: 10 },
      { role_code: "SubI", minutes: 15 },
      { role_code: "Lab", minutes: 15 },
      { role_code: "Admin", minutes: 10 },
    ]),
    roleCosts: DEFAULT_ROLE_COSTS,
    siteCostProfile: DEFAULT_SITE_PROFILE,
  },
  "SF-START-001": {
    procedure: procedure(
      "SF-START-001",
      "Study Startup / Site Activation Fee",
      [
        { role_code: "CRC", minutes: 120 },
        { role_code: "PI", minutes: 20 },
        { role_code: "SubI", minutes: 40 },
        { role_code: "Lab", minutes: 0 },
        { role_code: "Admin", minutes: 180 },
      ],
    ),
    roleCosts: DEFAULT_ROLE_COSTS,
    siteCostProfile: DEFAULT_SITE_PROFILE,
  },
}

export type TestCostAPIOkResponse = {
  ok: true
  result: CostBreakdown
}

export type TestCostAPIErrorResponse = {
  ok: false
  error: string
}

export type TestCostAPIResponse = TestCostAPIOkResponse | TestCostAPIErrorResponse

export type TestCostClientOptions = {
  /** Use when calling from the server (e.g. `process.env.NEXT_PUBLIC_APP_URL`). */
  baseUrl?: string
}

function testCostUrl(baseUrl?: string): string {
  if (baseUrl != null && baseUrl !== "") {
    return `${baseUrl.replace(/\/$/, "")}/api/test-cost`
  }
  return "/api/test-cost"
}

export async function callTestCostAPI(
  feeCode: string,
  options?: TestCostClientOptions,
): Promise<TestCostAPIResponse> {
  const payload = CLINIQ_DEFAULT_PAYLOADS[feeCode]
  if (!payload) {
    throw new Error(`No payload defined for feeCode: ${feeCode}`)
  }

  const res = await fetch(testCostUrl(options?.baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return res.json() as Promise<TestCostAPIResponse>
}

export async function callAllFees(
  options?: TestCostClientOptions,
): Promise<TestCostAPIResponse[]> {
  const codes = Object.keys(CLINIQ_DEFAULT_PAYLOADS)
  return Promise.all(codes.map((code) => callTestCostAPI(code, options)))
}
