import { describe, expect, it } from "vitest"

import { generateCounterofferText } from "./counteroffer-text"
import type { NegotiationEngineInput } from "./negotiation-input"

const basePayload: NegotiationEngineInput = {
  schemaVersion: "1.0",
  generatedAt: "2026-04-03T12:00:00.000Z",
  studyMeta: { studyId: "T1", studyName: "Test Study", siteName: "Demo Site" },
  decision: "negotiate",
  summary: {
    totalInternalRevenue: 1000,
    totalSponsorRevenue: 850,
    totalGap: -150,
    totalGapPerPatient: -15,
    projectedStudyGap: null,
    recommendedRevenueTargetAt20Margin: 1200,
    negativeCashFlowRisk: false,
    primaryAlerts: [],
  },
  lines: [],
  missingInvoiceables: [],
  topNegotiationTargets: [
    {
      id: "t1",
      kind: "loss",
      lineCode: "L1",
      label: "Screening",
      category: "Visit",
      visitName: "SCR",
      quantity: 1,
      unit: "visit",
      internalTotal: 500,
      sponsorTotalOffer: 400,
      gapAmount: -100,
      reason: "Test reason.",
    },
  ],
  justificationPoints: [
    "Point A about workload.",
    "Point B about compliance.",
  ],
  risk: { negativeCashFlowRisk: false, primaryAlerts: [] },
}

describe("generateCounterofferText", () => {
  it("produces sponsor-facing structured text with increases and rationale", () => {
    const text = generateCounterofferText(basePayload)
    expect(text).toContain("Subject: Budget counterproposal")
    expect(text).toContain("Test Study")
    expect(text).toContain("Demo Site")
    expect(text).toContain("[L1]")
    expect(text).toContain("increase $100")
    expect(text).toContain("Justification")
    expect(text).toContain("Point A about workload")
  })
})
