import { describe, expect, it } from "vitest"

import { runScenarioMatrix } from "./run-scenario-matrix"

describe("runScenarioMatrix", () => {
  it("runs internal scenario matrix", () => {
    const result = runScenarioMatrix()

    expect(result.summary.totalScenarios).toBeGreaterThanOrEqual(10)
  })
})
