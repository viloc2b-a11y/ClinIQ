import { describe, expect, it } from "vitest"

import { runActionCenterBinding } from "./run-action-center-binding"

describe("STEP 94 — Action Center binding", () => {
  it("persists and verifies action seeds when orchestration is eligible", () => {
    const writes: Array<{ items: Array<{ id: string }> }> = []

    const result = runActionCenterBinding({
      orchestration: {
        data: {
          actionSeeds: [
            {
              seedId: "seed-soa-1",
              type: "soa_activity_review",
              title: "Screening — CBC",
              estimatedValue: 125,
            },
            {
              seedId: "seed-budget-1",
              type: "budget_line_review",
              title: "Screening Fee — Screening",
              estimatedValue: 125,
            },
          ],
        },
        summary: {
          status: "ready",
          totalActionSeeds: 2,
          executionReady: true,
        },
      },
      persistActionCenterItems: (payload) => {
        writes.push(payload)
        return { ok: true }
      },
      verifyPersistedItems: ({ expectedIds }) => ({
        totalExpected: expectedIds.length,
        found: expectedIds.length,
        missing: [],
        matched: expectedIds,
      }),
    })

    expect(result.summary.status).toBe("persisted")
    expect(result.summary.attemptedWrite).toBe(true)
    expect(result.summary.verified).toBe(true)
    expect(writes.length).toBe(1)
  })

  it("skips persistence when orchestration is blocked", () => {
    const result = runActionCenterBinding({
      orchestration: {
        data: {
          actionSeeds: [],
        },
        summary: {
          status: "blocked",
          totalActionSeeds: 0,
          executionReady: false,
        },
      },
    })

    expect(result.summary.status).toBe("skipped")
    expect(result.summary.attemptedWrite).toBe(false)
  })
})
