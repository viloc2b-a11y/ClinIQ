import { describe, expect, it } from "vitest"

import { getScenarioFamily } from "./get-scenario-family"

describe("getScenarioFamily", () => {
  it("gets scenario family by key", () => {
    const result = getScenarioFamily({
      key: "happy_path",
    })

    expect(result.summary.found).toBe(true)
    expect(result.data.family?.scenarioKeys.includes("budget_simple_happy_path")).toBe(true)
  })
})
