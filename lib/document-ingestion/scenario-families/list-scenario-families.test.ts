import { describe, expect, it } from "vitest"

import { listScenarioFamilies } from "./list-scenario-families"

describe("listScenarioFamilies", () => {
  it("lists scenario families", () => {
    const result = listScenarioFamilies()

    expect(result.summary.totalFamilies).toBeGreaterThanOrEqual(6)
  })
})
