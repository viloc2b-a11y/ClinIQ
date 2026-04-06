import { describe, expect, it } from "vitest"

import { runScenarioTracePack } from "./run-scenario-trace-pack"

describe("runScenarioTracePack", () => {
  it("runs scenario trace pack", () => {
    const result = runScenarioTracePack({
      key: "budget_simple_happy_path",
    })

    expect(result.summary.found).toBe(true)
    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
  })
})
