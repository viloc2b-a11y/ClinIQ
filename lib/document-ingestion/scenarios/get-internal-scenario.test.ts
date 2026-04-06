import { describe, expect, it } from "vitest"

import { getInternalScenario } from "./get-internal-scenario"

describe("getInternalScenario", () => {
  it("gets internal scenario by key", () => {
    const result = getInternalScenario({
      key: "budget_simple_happy_path",
    })

    expect(result.summary.found).toBe(true)
    expect(result.data.scenario?.fixtureType).toBe("excel_simple_budget")
  })
})
