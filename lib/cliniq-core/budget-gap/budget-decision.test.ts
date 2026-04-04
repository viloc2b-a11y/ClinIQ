import { describe, expect, it } from "vitest"

import { determineBudgetDecision } from "./budget-decision"
import type { BudgetGapSummary } from "./types"

function s(partial: Partial<BudgetGapSummary>): BudgetGapSummary {
  return {
    totalInternalRevenue: 1000,
    totalSponsorRevenue: 900,
    totalGap: -100,
    totalGapPerPatient: null,
    projectedStudyGap: null,
    recommendedRevenueTargetAt20Margin: 1200,
    negativeCashFlowRisk: false,
    primaryAlerts: [],
    ...partial,
  }
}

describe("determineBudgetDecision", () => {
  it('returns "reject" when negativeCashFlowRisk is true', () => {
    expect(determineBudgetDecision(s({ negativeCashFlowRisk: true }))).toBe(
      "reject",
    )
  })

  it('returns "reject" when totalGap is worse than -20% of internal', () => {
    expect(
      determineBudgetDecision(
        s({
          totalInternalRevenue: 1000,
          totalGap: -201,
          negativeCashFlowRisk: false,
        }),
      ),
    ).toBe("reject")
  })

  it('returns "negotiate" for a recoverable shortfall (below 20%) without risk flag', () => {
    expect(
      determineBudgetDecision(
        s({
          totalInternalRevenue: 1000,
          totalGap: -100,
          negativeCashFlowRisk: false,
        }),
      ),
    ).toBe("negotiate")
  })

  it('returns "accept" when blended margin is at least 10%', () => {
    expect(
      determineBudgetDecision(
        s({
          totalInternalRevenue: 1000,
          totalSponsorRevenue: 1100,
          totalGap: 100,
          negativeCashFlowRisk: false,
        }),
      ),
    ).toBe("accept")
  })

  it('returns "negotiate" when gap is non-negative but margin is under 10%', () => {
    expect(
      determineBudgetDecision(
        s({
          totalInternalRevenue: 1000,
          totalSponsorRevenue: 1050,
          totalGap: 50,
          negativeCashFlowRisk: false,
        }),
      ),
    ).toBe("negotiate")
  })
})
