import { describe, expect, it } from "vitest"

import { buildNegotiationStrategy } from "./negotiation-strategy"
import type { NegotiationTarget } from "./negotiation-input"

function t(partial: Partial<NegotiationTarget> & Pick<NegotiationTarget, "id" | "kind" | "gapAmount">): NegotiationTarget {
  return {
    lineCode: "L",
    label: "Lbl",
    category: "Visit",
    visitName: "V1",
    quantity: 1,
    unit: "ea",
    internalTotal: 100,
    sponsorTotalOffer: 0,
    reason: "r",
    ...partial,
  } as NegotiationTarget
}

describe("buildNegotiationStrategy", () => {
  it("places all missing targets in mustFix", () => {
    const targets = [
      t({ id: "m1", kind: "missing", gapAmount: -100 }),
      t({ id: "l1", kind: "loss", gapAmount: -10_000 }),
    ]
    const bucket = buildNegotiationStrategy(targets)
    expect(bucket.mustFix.some((x) => x.id === "m1")).toBe(true)
    expect(bucket.shouldImprove).toHaveLength(0)
    expect(bucket.ignore).toHaveLength(0)
  })

  it("classifies large loss (|gap| >= 5000) as mustFix", () => {
    const targets = [t({ id: "l1", kind: "loss", gapAmount: -5000 })]
    const bucket = buildNegotiationStrategy(targets)
    expect(bucket.mustFix).toHaveLength(1)
    expect(bucket.mustFix[0].id).toBe("l1")
  })

  it("classifies mid loss (1000 <= |gap| < 5000) as shouldImprove", () => {
    const targets = [t({ id: "l1", kind: "loss", gapAmount: -2500 })]
    const bucket = buildNegotiationStrategy(targets)
    expect(bucket.shouldImprove).toHaveLength(1)
    expect(bucket.mustFix).toHaveLength(0)
    expect(bucket.ignore).toHaveLength(0)
  })

  it("classifies small loss (|gap| < 1000) as ignore", () => {
    const targets = [t({ id: "l1", kind: "loss", gapAmount: -500 })]
    const bucket = buildNegotiationStrategy(targets)
    expect(bucket.ignore).toHaveLength(1)
  })

  it("sorts each bucket by descending |gapAmount|", () => {
    const targets = [
      t({ id: "l1", kind: "loss", gapAmount: -1500 }),
      t({ id: "l2", kind: "loss", gapAmount: -3000 }),
      t({ id: "l3", kind: "loss", gapAmount: -2000 }),
    ]
    const bucket = buildNegotiationStrategy(targets)
    expect(bucket.shouldImprove.map((x) => x.id)).toEqual(["l2", "l3", "l1"])
  })

  it("does not mutate the input array", () => {
    const targets = [
      t({ id: "a", kind: "loss", gapAmount: -2000 }),
      t({ id: "b", kind: "loss", gapAmount: -1000 }),
    ]
    const copy = [...targets]
    buildNegotiationStrategy(targets)
    expect(targets).toEqual(copy)
    expect(targets[0]).toBe(copy[0])
  })
})
