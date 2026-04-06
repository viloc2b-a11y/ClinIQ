import { describe, expect, it } from "vitest"

import { runScenarioCatalog } from "./run-scenario-catalog"

describe("runScenarioCatalog", () => {
  it("runs internal scenario catalog", () => {
    const result = runScenarioCatalog()

    expect(result.summary.totalEntries).toBeGreaterThanOrEqual(10)
  })
})
