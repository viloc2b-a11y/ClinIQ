import { describe, expect, it } from "vitest"

import { buildScenarioMatrixSummary } from "./build-scenario-matrix-summary"

describe("buildScenarioMatrixSummary", () => {
  it("builds scenario matrix summary counts", () => {
    const result = buildScenarioMatrixSummary({
      rows: [
        { status: "ready", outputsReady: true },
        { status: "partial", outputsReady: false },
        { status: "blocked", outputsReady: false },
      ],
    })

    expect(result.summary.totalScenarios).toBe(3)
    expect(result.summary.readyCount).toBe(1)
    expect(result.summary.partialCount).toBe(1)
    expect(result.summary.blockedCount).toBe(1)
  })
})
