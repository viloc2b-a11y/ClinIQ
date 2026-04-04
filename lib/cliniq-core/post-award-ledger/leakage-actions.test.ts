import { describe, expect, it } from "vitest"

import { buildLeakageActions } from "./leakage-actions"
import type { QuantifiedRevenueLeakageReport } from "./quantify-leakage"

function baseReport(overrides: Partial<QuantifiedRevenueLeakageReport> = {}): QuantifiedRevenueLeakageReport {
  return {
    studyId: "S-1",
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-01-31",
    totalExpected: 0,
    totalInvoiced: 0,
    totalLeakage: 0,
    leakagePct: 0,
    status: "ok",
    lineBreakdown: [],
    topLeakers: [],
    ...overrides,
  }
}

describe("buildLeakageActions", () => {
  it("includes only lines with leakage > 0", () => {
    const report = baseReport({
      lineBreakdown: [
        {
          lineCode: "OK",
          label: "Fully invoiced",
          expected: 100,
          invoiced: 100,
          leakage: 0,
          leakagePct: 0,
          status: "ok",
        },
        {
          lineCode: "LEAK",
          label: "Short",
          expected: 200,
          invoiced: 50,
          leakage: 150,
          leakagePct: 0.75,
          status: "critical",
        },
      ],
    })
    const actions = buildLeakageActions(report)
    expect(actions).toHaveLength(1)
    expect(actions[0].lineCode).toBe("LEAK")
  })

  it("assigns priority and actionType from line status", () => {
    const report = baseReport({
      lineBreakdown: [
        {
          lineCode: "C",
          label: "Critical line",
          expected: 100,
          invoiced: 50,
          leakage: 50,
          leakagePct: 0.5,
          status: "critical",
        },
        {
          lineCode: "W",
          label: "Warning line",
          expected: 100,
          invoiced: 85,
          leakage: 15,
          leakagePct: 0.15,
          status: "warning",
        },
        {
          lineCode: "O",
          label: "Ok but small leak",
          expected: 1000,
          invoiced: 980,
          leakage: 20,
          leakagePct: 0.02,
          status: "ok",
        },
      ],
    })
    const actions = buildLeakageActions(report)
    const byCode = Object.fromEntries(actions.map((a) => [a.lineCode, a]))
    expect(byCode.C).toMatchObject({ priority: 1, actionType: "review_billing" })
    expect(byCode.W).toMatchObject({ priority: 2, actionType: "verify_execution" })
    expect(byCode.O).toMatchObject({ priority: 3, actionType: "check_documentation" })
    expect(byCode.C?.message).toBe("Review billed amount against expected revenue.")
    expect(byCode.W?.message).toBe("Verify procedure execution and billing submission.")
    expect(byCode.O?.message).toBe("Check supporting documentation and billing readiness.")
  })

  it("uses the zero-invoiced message when invoiced is 0 and expected > 0", () => {
    const report = baseReport({
      lineBreakdown: [
        {
          lineCode: "Z",
          label: "Never invoiced",
          expected: 500,
          invoiced: 0,
          leakage: 500,
          leakagePct: 1,
          status: "critical",
        },
      ],
    })
    const [a] = buildLeakageActions(report)
    expect(a.message).toBe("No invoiced amount detected for expected billable line.")
  })

  it("sorts by leakage desc, then leakageRatePct desc, then lineCode asc", () => {
    const report = baseReport({
      lineBreakdown: [
        {
          lineCode: "B",
          label: "b",
          expected: 100,
          invoiced: 0,
          leakage: 50,
          leakagePct: 0.5,
          status: "critical",
        },
        {
          lineCode: "A",
          label: "a",
          expected: 100,
          invoiced: 0,
          leakage: 50,
          leakagePct: 0.6,
          status: "critical",
        },
        {
          lineCode: "C",
          label: "c",
          expected: 200,
          invoiced: 0,
          leakage: 100,
          leakagePct: 0.5,
          status: "critical",
        },
      ],
    })
    const codes = buildLeakageActions(report).map((x) => x.lineCode)
    expect(codes).toEqual(["C", "A", "B"])
  })

  it("returns at most 5 actions", () => {
    const lineBreakdown = [1, 2, 3, 4, 5, 6].map((n) => ({
      lineCode: `L${n}`,
      label: `Line ${n}`,
      expected: 100,
      invoiced: 0,
      leakage: n * 10,
      leakagePct: 1,
      status: "critical" as const,
    }))
    const report = baseReport({ lineBreakdown })
    expect(buildLeakageActions(report)).toHaveLength(5)
  })
})
