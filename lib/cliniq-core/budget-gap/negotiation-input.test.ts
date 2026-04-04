import { describe, expect, it } from "vitest"

import { compareSponsorBudgetToInternalBudget } from "./compare"
import { budgetGapResultToNegotiationEngineInput } from "./negotiation-input"

describe("budgetGapResultToNegotiationEngineInput", () => {
  it("produces a versioned payload with prioritized lines for Module 4", () => {
    const result = compareSponsorBudgetToInternalBudget({
      internalLines: [
        {
          id: "i1",
          category: "Visit",
          lineCode: "L1",
          label: "Visit A",
          visitName: "V1",
          quantity: 1,
          unit: "ea",
          internalUnitCost: 100,
          internalTotal: 100,
          notes: "",
          source: "internal-model",
        },
      ],
      sponsorLines: [
        {
          id: "s1",
          category: "Visit",
          lineCode: "S1",
          label: "Visit A",
          visitName: "V1",
          quantity: 1,
          unit: "ea",
          sponsorUnitOffer: 80,
          sponsorTotalOffer: 80,
          notes: "",
          source: "sponsor-budget",
        },
      ],
      studyMeta: { studyId: "S1" },
    })

    const payload = budgetGapResultToNegotiationEngineInput(result, {
      studyId: "S1",
    }, { generatedAt: "2026-04-03T12:00:00.000Z" })

    expect(payload.schemaVersion).toBe("1.0")
    expect(payload.generatedAt).toBe("2026-04-03T12:00:00.000Z")
    expect(payload.decision).toBe("reject")
    expect(payload.lines).toHaveLength(1)
    expect(payload.lines[0].negotiationPriority).toBe("high")
    expect(payload.lines[0].status).toBe("loss")
    expect(payload.risk.negativeCashFlowRisk).toBe(true)
    expect(payload.topNegotiationTargets.length).toBeGreaterThanOrEqual(1)
    expect(payload.topNegotiationTargets[0].kind).toBe("loss")
    expect(payload.justificationPoints.length).toBeGreaterThan(0)
  })
})
