import { describe, expect, it } from "vitest"

import {
  CLINICAL_COST_SCREENING_DIABETES_EXAMPLE,
  clinicalRoleCostsToRoleCosts,
  clinicalSiteContextToSiteCostProfile,
} from "./clinical-cost-payload"
import { recommendedFeePriceWithComplexity } from "./site-fee-template.lookup"

describe("clinical-cost-payload", () => {
  it("maps screening diabetes example to Cost Truth role + site shapes", () => {
    const p = CLINICAL_COST_SCREENING_DIABETES_EXAMPLE
    const roles = clinicalRoleCostsToRoleCosts(p.roleCosts)
    expect(roles).toHaveLength(5)
    expect(roles.find((r) => r.role_code === "CRC")?.hourly_cost).toBe(82.5)
    expect(roles.find((r) => r.role_code === "PI")?.hourly_cost).toBe(185)

    const site = clinicalSiteContextToSiteCostProfile(p.siteCostProfile)
    expect(site.overhead_percent).toBe(0.32)
    expect(site.margin_target).toBe(0.2)
  })

  it("fee reference diabetes price matches site pack recommended-with-complexity", () => {
    const ref =
      CLINICAL_COST_SCREENING_DIABETES_EXAMPLE.siteCostProfile.feeReferenceData
    const fromRef =
      ref.complexityAdjusted?.diabetes ?? ref.pricing.recommended
    expect(fromRef).toBe(520)

    const feeFromTemplate = recommendedFeePriceWithComplexity(
      {
        feeCode: ref.feeCode,
        feeName: "",
        category: "",
        unit: "",
        trigger: ref.trigger,
        billing: ref.billing,
        paymentTerms: ref.paymentTerms,
        priority: "",
        negotiationCategory: ref.negotiationCategory,
        minAcceptablePercent: ref.minAcceptablePercent,
        maxConcession: ref.maxConcession,
        pricing: ref.pricing,
        complexityAdjusted: ref.complexityAdjusted,
        justificationTemplate: ref.justificationTemplate,
        paymentStrategy: "",
        notes: "",
      },
      "diabetes",
    )
    expect(feeFromTemplate).toBe(520)
  })
})
