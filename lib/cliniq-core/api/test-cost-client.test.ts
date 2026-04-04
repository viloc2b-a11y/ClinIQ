import { describe, expect, it } from "vitest"

import { calculateProcedureCost } from "../cost-truth/cost-engine"
import { CLINIQ_DEFAULT_PAYLOADS } from "./test-cost-client"

describe("CLINIQ_DEFAULT_PAYLOADS", () => {
  it("each entry satisfies Cost Truth engine (no missing role_code)", () => {
    for (const [code, p] of Object.entries(CLINIQ_DEFAULT_PAYLOADS)) {
      const out = calculateProcedureCost(
        p.procedure,
        p.roleCosts,
        p.siteCostProfile,
      )
      expect(out.price_with_margin, code).toBeGreaterThan(0)
    }
  })
})
