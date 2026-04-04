import { describe, expect, it } from "vitest"

import type { InternalBudgetLine } from "../budget-gap/types"
import { generateBillablesFromEvent } from "./billables-from-events"
import { generateExpectedBillablesFromBudget } from "./expected-billables"
import { buildLedger } from "./ledger"
import { detectRevenueLeakage } from "./leakage"

function sampleBudget(): InternalBudgetLine[] {
  return [
    {
      id: "b-su",
      category: "Startup",
      lineCode: "SU",
      label: "Startup fee",
      visitName: "N/A",
      quantity: 1,
      unit: "ls",
      internalUnitCost: 8_000,
      internalTotal: 8_000,
      notes: "",
      source: "internal-model",
    },
    {
      id: "b-v1",
      category: "Visit",
      lineCode: "V1",
      label: "On-site visit",
      visitName: "V1",
      quantity: 4,
      unit: "v",
      internalUnitCost: 250,
      internalTotal: 1_000,
      notes: "",
      source: "internal-model",
    },
    {
      id: "b-sf",
      category: "Screen failure",
      lineCode: "SF",
      label: "Screen failure",
      visitName: "Screening",
      quantity: 2,
      unit: "ea",
      internalUnitCost: 150,
      internalTotal: 300,
      notes: "",
      source: "internal-model",
    },
  ]
}

describe("post-award ledger", () => {
  it("generateExpectedBillablesFromBudget mirrors internal totals and unit prices", () => {
    const exp = generateExpectedBillablesFromBudget(sampleBudget(), {
      studyId: "S-1",
    })
    expect(exp).toHaveLength(3)
    expect(exp[0].lineCode).toBe("SU")
    expect(exp[0].expectedRevenue).toBe(8_000)
    expect(exp[0].unitPrice).toBe(8_000)
    expect(exp[1].lineCode).toBe("V1")
    expect(exp[1].unitPrice).toBe(250)
    expect(exp[1].expectedRevenue).toBe(1_000)
    expect(exp.every((e) => e.studyId === "S-1")).toBe(true)
  })

  it("detects fully missing billables when no events are recorded", () => {
    const expected = generateExpectedBillablesFromBudget(sampleBudget())
    const ledger = buildLedger(expected, [])
    const report = detectRevenueLeakage(ledger)

    expect(ledger.every((l) => l.status === "none")).toBe(true)
    expect(report.totalExpectedRevenue).toBe(8_000 + 1_000 + 300)
    expect(report.totalActualRevenue).toBe(0)
    expect(report.leakageAmount).toBe(report.totalExpectedRevenue)
    expect(report.fullyMissingBillables).toHaveLength(3)
    expect(report.partialBillables).toHaveLength(0)
  })

  it("aggregates multiple billable instances on the same lineCode", () => {
    const expected = generateExpectedBillablesFromBudget(sampleBudget())
    const e1 = generateBillablesFromEvent(
      {
        id: "ev-a",
        studyId: "S-1",
        occurredAt: "2026-04-01T12:00:00Z",
        eventType: "visit_completed",
        lineCode: "V1",
        quantity: 1,
      },
      expected,
    )!
    const e2 = generateBillablesFromEvent(
      {
        id: "ev-b",
        studyId: "S-1",
        occurredAt: "2026-04-02T12:00:00Z",
        eventType: "visit_completed",
        lineCode: "V1",
        quantity: 1,
      },
      expected,
    )!
    const ledger = buildLedger(expected, [e1, e2])
    const v1 = ledger.find((l) => l.lineCode === "V1")!

    expect(v1.matchedBillableCount).toBe(2)
    expect(v1.actualRevenue).toBe(500)
    expect(v1.expectedRevenue).toBe(1_000)
    expect(v1.status).toBe("partial")
  })

  it("computes leakage as sum of per-line shortfalls", () => {
    const expected = generateExpectedBillablesFromBudget(sampleBudget())
    const su = generateBillablesFromEvent(
      {
        id: "ev-su",
        studyId: "S-1",
        occurredAt: "2026-04-01T10:00:00Z",
        eventType: "milestone",
        lineCode: "SU",
        quantity: 1,
      },
      expected,
    )!
    const v1 = generateBillablesFromEvent(
      {
        id: "ev-v1",
        studyId: "S-1",
        occurredAt: "2026-04-01T11:00:00Z",
        eventType: "visit_completed",
        lineCode: "V1",
        quantity: 2,
      },
      expected,
    )!
    const ledger = buildLedger(expected, [su, v1])
    const report = detectRevenueLeakage(ledger)

    expect(report.totalExpectedRevenue).toBe(9_300)
    expect(report.totalActualRevenue).toBe(8_000 + 500)
    expect(report.leakageAmount).toBe(500 + 300)
    expect(report.fullyMissingBillables.map((x) => x.lineCode).sort()).toEqual([
      "SF",
    ])
    expect(report.partialBillables.map((x) => x.lineCode)).toEqual(["V1"])
  })

  it("generateBillablesFromEvent returns null for unknown line codes", () => {
    const expected = generateExpectedBillablesFromBudget(sampleBudget())
    const b = generateBillablesFromEvent(
      {
        id: "x",
        studyId: "S-1",
        occurredAt: "2026-04-01T00:00:00Z",
        eventType: "adhoc",
        lineCode: "ZZZ",
      },
      expected,
    )
    expect(b).toBeNull()
  })
})
