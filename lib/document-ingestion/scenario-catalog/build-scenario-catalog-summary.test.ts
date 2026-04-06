import { describe, expect, it } from "vitest"

import { buildScenarioCatalogSummary } from "./build-scenario-catalog-summary"

describe("buildScenarioCatalogSummary", () => {
  it("builds scenario catalog summary counts", () => {
    const result = buildScenarioCatalogSummary({
      entries: [
        { status: "ready", outputsReady: true },
        { status: "partial", outputsReady: false },
        { status: "blocked", outputsReady: false },
      ],
    })

    expect(result.summary.totalEntries).toBe(3)
    expect(result.summary.readyCount).toBe(1)
    expect(result.summary.partialCount).toBe(1)
    expect(result.summary.blockedCount).toBe(1)
  })
})
