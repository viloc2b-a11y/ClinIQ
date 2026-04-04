import { describe, expect, it } from "vitest"

import {
  applyEscalation,
  applyEscalationToTargets,
  getEscalationFactor,
} from "./pricing-escalation"
import type { NegotiationTarget } from "./negotiation-input"

const baseTarget = (over: Partial<NegotiationTarget>): NegotiationTarget => ({
  id: "1",
  kind: "loss",
  lineCode: "X",
  label: "L",
  category: over.category ?? "General",
  visitName: "V",
  quantity: 1,
  unit: "ea",
  internalTotal: 1000,
  sponsorTotalOffer: 800,
  gapAmount: -200,
  reason: "r",
  ...over,
})

describe("getEscalationFactor", () => {
  it("maps startup-style categories to 1.30", () => {
    expect(getEscalationFactor("Startup")).toBe(1.3)
    expect(getEscalationFactor("site activation fee")).toBe(1.3)
  })

  it("maps screen failure to 1.00", () => {
    expect(getEscalationFactor("Screen failure")).toBe(1.0)
    expect(getEscalationFactor("screen fail fee")).toBe(1.0)
  })

  it("maps lab / logistics / specimen / shipping / dry ice to 1.25", () => {
    expect(getEscalationFactor("Lab handling")).toBe(1.25)
    expect(getEscalationFactor("specimen processing")).toBe(1.25)
    expect(getEscalationFactor("dry ice courier")).toBe(1.25)
    expect(getEscalationFactor("Shipping lane")).toBe(1.25)
  })

  it("maps close-out / archive to 1.20", () => {
    expect(getEscalationFactor("Study close-out")).toBe(1.2)
    expect(getEscalationFactor("archiving")).toBe(1.2)
  })

  it("maps pharmacy / IP / accountability to 1.20", () => {
    expect(getEscalationFactor("Pharmacy / IP handling")).toBe(1.2)
    expect(getEscalationFactor("drug accountability")).toBe(1.2)
  })

  it("maps regulatory / amendment to 1.20", () => {
    expect(getEscalationFactor("Regulatory amendment review")).toBe(1.2)
  })

  it("uses default 1.15", () => {
    expect(getEscalationFactor("Visit")).toBe(1.15)
    expect(getEscalationFactor("Random misc")).toBe(1.15)
  })
})

describe("applyEscalation", () => {
  it("computes recommendedTotal as rounded internalTotal * factor", () => {
    const target = baseTarget({ category: "Startup", internalTotal: 10_000 })
    const e = applyEscalation(target)
    expect(e.escalationFactor).toBe(1.3)
    expect(e.recommendedTotal).toBe(13_000)
  })

  it("sets increaseAmount to recommendedTotal - sponsorBase, floored at 0", () => {
    const target = baseTarget({
      category: "Visit",
      internalTotal: 1000,
      sponsorTotalOffer: 1200,
    })
    const e = applyEscalation(target)
    expect(e.recommendedTotal).toBe(1150)
    expect(e.increaseAmount).toBe(0)
  })

  it("treats missing sponsor as 0 for missing-kind rows", () => {
    const target: NegotiationTarget = {
      id: "m",
      kind: "missing",
      lineCode: "SF",
      label: "SF",
      category: "Screen failure",
      visitName: "SCR",
      quantity: 1,
      unit: "ea",
      internalTotal: 2000,
      sponsorTotalOffer: 0,
      gapAmount: -2000,
      reason: "r",
    }
    const e = applyEscalation(target)
    expect(e.escalationFactor).toBe(1.0)
    expect(e.recommendedTotal).toBe(2000)
    expect(e.increaseAmount).toBe(2000)
  })

  it("does not mutate the input target", () => {
    const target = baseTarget({})
    const snap = { ...target }
    applyEscalation(target)
    expect(target).toEqual(snap)
  })
})

describe("applyEscalationToTargets", () => {
  it("maps each target", () => {
    const list = [
      baseTarget({ id: "a" }),
      baseTarget({ id: "b", category: "Startup", internalTotal: 10_000 }),
    ]
    const out = applyEscalationToTargets(list)
    expect(out).toHaveLength(2)
    expect(out[1].recommendedTotal).toBe(13_000)
  })
})
