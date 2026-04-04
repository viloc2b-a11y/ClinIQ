import { describe, expect, it } from "vitest"

import {
  buildScenarioSet,
  simulateNegotiationScenario,
} from "./negotiation-scenarios"
import type { EscalatedNegotiationTarget } from "./pricing-escalation"

const targets: EscalatedNegotiationTarget[] = [
  {
    id: "1",
    kind: "loss",
    lineCode: "A",
    label: "A",
    category: "Visit",
    visitName: "V",
    quantity: 1,
    unit: "ea",
    internalTotal: 1000,
    sponsorTotalOffer: 500,
    gapAmount: -500,
    reason: "r",
    recommendedTotal: 1150,
    increaseAmount: 650,
    escalationFactor: 1.15,
  },
  {
    id: "2",
    kind: "loss",
    lineCode: "B",
    label: "B",
    category: "Visit",
    visitName: "V",
    quantity: 1,
    unit: "ea",
    internalTotal: 500,
    sponsorTotalOffer: 400,
    gapAmount: -100,
    reason: "r",
    recommendedTotal: 575,
    increaseAmount: 175,
    escalationFactor: 1.15,
  },
]

describe("simulateNegotiationScenario", () => {
  it("applies full_accept factor 1", () => {
    const r = simulateNegotiationScenario(targets, "full_accept")
    expect(r.recoveryFactor).toBe(1)
    expect(r.requestedIncreaseTotal).toBe(825)
    expect(r.recoveredRevenue).toBe(825)
    expect(r.remainingUnrecovered).toBe(0)
  })

  it("applies partial_70 factor 0.7", () => {
    const r = simulateNegotiationScenario(targets, "partial_70")
    expect(r.recoveryFactor).toBe(0.7)
    expect(r.requestedIncreaseTotal).toBe(825)
    expect(r.recoveredRevenue).toBe(578)
    expect(r.remainingUnrecovered).toBe(247)
  })

  it("applies partial_50 factor 0.5", () => {
    const r = simulateNegotiationScenario(targets, "partial_50")
    expect(r.recoveryFactor).toBe(0.5)
    expect(r.recoveredRevenue).toBe(413)
    expect(r.remainingUnrecovered).toBe(412)
  })

  it("applies reject factor 0", () => {
    const r = simulateNegotiationScenario(targets, "reject")
    expect(r.recoveryFactor).toBe(0)
    expect(r.recoveredRevenue).toBe(0)
    expect(r.remainingUnrecovered).toBe(825)
  })
})

describe("buildScenarioSet", () => {
  it("returns four scenarios in fixed order", () => {
    const set = buildScenarioSet(targets)
    expect(set.map((s) => s.scenario)).toEqual([
      "full_accept",
      "partial_70",
      "partial_50",
      "reject",
    ])
  })
})
