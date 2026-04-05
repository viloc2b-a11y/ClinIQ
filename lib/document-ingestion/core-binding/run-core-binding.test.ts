import { describe, expect, it } from "vitest"

import { runCoreBinding } from "./run-core-binding"

describe("STEP 92 — Core binding", () => {
  it("builds core binding package from ready downstream bridge", () => {
    const result = runCoreBinding({
      downstream: {
        data: {
          bridge: {
            data: {
              soa: {
                rows: [
                  {
                    visitName: "Screening",
                    activityDescription: "CBC",
                    unitPrice: 125,
                  },
                ],
              },
              budget: {
                rows: [
                  {
                    category: "Screening Fee",
                    visitName: "Screening",
                    unitPrice: 125,
                  },
                ],
              },
              contract: {
                rows: [
                  {
                    clauseType: "payment_terms",
                    clauseText: "Sponsor will pay within 45 days.",
                  },
                ],
              },
            },
            summary: {
              status: "ready",
              soaRows: 1,
              budgetRows: 1,
              contractRows: 1,
            },
          },
        },
      },
    })

    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
    expect(result.summary.executionReady).toBe(true)
    expect(result.data.executionPackage).not.toBe(null)
    const pkg = result.data.executionPackage as {
      soaRows: Array<{ activityName: string }>
    }
    expect(pkg.soaRows[0]!.activityName).toBe("CBC")
  })

  it("blocks execution package when downstream bridge is blocked", () => {
    const result = runCoreBinding({
      downstream: {
        data: {
          bridge: {
            data: {
              soa: { rows: [] },
              budget: { rows: [] },
              contract: { rows: [] },
            },
            summary: {
              status: "blocked",
              soaRows: 0,
              budgetRows: 0,
              contractRows: 0,
            },
          },
        },
      },
    })

    expect(result.summary.status).toBe("blocked")
    expect(result.summary.executionReady).toBe(false)
    expect(result.data.executionPackage).toBe(null)
  })
})
