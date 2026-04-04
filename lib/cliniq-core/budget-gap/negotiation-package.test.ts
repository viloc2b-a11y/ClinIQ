import { describe, expect, it } from "vitest"

import { buildNegotiationPackage } from "./negotiation-package"
import type { NegotiationEngineInput } from "./negotiation-input"

const basePayload = (): NegotiationEngineInput => ({
  schemaVersion: "1.0",
  generatedAt: "2026-01-01T00:00:00.000Z",
  studyMeta: { studyId: "S1" },
  decision: "negotiate",
  summary: {
    totalInternalRevenue: 10_000,
    totalSponsorRevenue: 8000,
    totalGap: -2000,
    totalGapPerPatient: null,
    projectedStudyGap: null,
    recommendedRevenueTargetAt20Margin: 12_000,
    negativeCashFlowRisk: false,
    primaryAlerts: [],
  },
  lines: [],
  missingInvoiceables: [],
  topNegotiationTargets: [
    {
      id: "m1",
      kind: "missing",
      lineCode: "SF",
      label: "Screen failure",
      category: "Screen failure",
      visitName: "SCR",
      quantity: 1,
      unit: "ea",
      internalTotal: 900,
      sponsorTotalOffer: 0,
      gapAmount: -900,
      notes: "Custom sponsor note for SF.",
      reason: "missing",
    },
    {
      id: "l1",
      kind: "loss",
      lineCode: "L1",
      label: "Big loss",
      category: "Visit",
      visitName: "V1",
      quantity: 1,
      unit: "ea",
      internalTotal: 8000,
      sponsorTotalOffer: 2000,
      gapAmount: -6000,
      reason: "loss",
    },
    {
      id: "l2",
      kind: "loss",
      lineCode: "L2",
      label: "Mid loss",
      category: "Visit",
      visitName: "V2",
      quantity: 1,
      unit: "ea",
      internalTotal: 2000,
      sponsorTotalOffer: 500,
      gapAmount: -1500,
      reason: "loss",
    },
    {
      id: "l3",
      kind: "loss",
      lineCode: "L3",
      label: "Small loss",
      category: "Visit",
      visitName: "V3",
      quantity: 1,
      unit: "ea",
      internalTotal: 500,
      sponsorTotalOffer: 400,
      gapAmount: -100,
      reason: "loss",
    },
  ],
  justificationPoints: ["J1", "J2"],
  risk: { negativeCashFlowRisk: false, primaryAlerts: [] },
})

describe("buildNegotiationPackage", () => {
  it("builds sponsorView rows with correct shape", () => {
    const pkg = buildNegotiationPackage(basePayload())
    expect(pkg.sponsorView).toHaveLength(4)
    for (const row of pkg.sponsorView) {
      expect(row).toHaveProperty("label")
      expect(row).toHaveProperty("category")
      expect(row).toHaveProperty("requestedTotal")
      expect(row).toHaveProperty("requestedIncrease")
      expect(row).toHaveProperty("justification")
    }
    const sf = pkg.sponsorView.find((r) => r.label === "Screen failure")
    expect(sf?.justification).toBe("Custom sponsor note for SF.")
  })

  it("uses generic justification when notes are absent", () => {
    const pkg = buildNegotiationPackage(basePayload())
    const big = pkg.sponsorView.find((r) => r.label === "Big loss")
    expect(big?.justification).toContain("workload")
  })

  it("includes decision, escalated targets, strategy, scenarios, and justificationPoints in internalView", () => {
    const pkg = buildNegotiationPackage(basePayload())
    expect(pkg.internalView.decision).toBe("negotiate")
    expect(pkg.internalView.targets).toHaveLength(4)
    expect(pkg.internalView.targets[0]).toHaveProperty("escalationFactor")
    expect(pkg.internalView.justificationPoints).toEqual(["J1", "J2"])
    expect(pkg.internalView.scenarios).toHaveLength(4)
  })

  it("populates strategy buckets from thresholds", () => {
    const pkg = buildNegotiationPackage(basePayload())
    const { strategy } = pkg.internalView
    expect(strategy.mustFix.map((t) => t.id).sort()).toEqual(["l1", "m1"])
    expect(strategy.shouldImprove.map((t) => t.id)).toEqual(["l2"])
    expect(strategy.ignore.map((t) => t.id)).toEqual(["l3"])
  })
})
