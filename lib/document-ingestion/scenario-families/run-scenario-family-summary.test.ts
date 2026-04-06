import { describe, expect, it } from "vitest"

import { runScenarioFamilySummary } from "./run-scenario-family-summary"

describe("runScenarioFamilySummary", () => {
  it("runs scenario family summary", () => {
    const result = runScenarioFamilySummary()

    expect(result.summary.totalFamilies).toBeGreaterThanOrEqual(6)
  })
})
