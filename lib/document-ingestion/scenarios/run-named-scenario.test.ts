import { describe, expect, it } from "vitest"

import { runNamedScenario } from "./run-named-scenario"

describe("runNamedScenario", () => {
  it("runs named internal scenario", () => {
    const result = runNamedScenario({
      key: "budget_simple_happy_path",
    })

    expect(result.summary.found).toBe(true)
    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
  })
})
