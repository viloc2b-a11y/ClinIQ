import { describe, expect, it } from "vitest"

import { runScenarioCliView } from "./run-scenario-cli-view"

describe("runScenarioCliView", () => {
  it("builds scenario cli text output", () => {
    const result = runScenarioCliView({
      key: "budget_simple_happy_path",
    })

    expect(result.summary.found).toBe(true)
    expect(result.data.text).toContain("ClinIQ")
  })
})
