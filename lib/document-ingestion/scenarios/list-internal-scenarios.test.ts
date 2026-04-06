import { describe, expect, it } from "vitest"

import { listInternalScenarios } from "./list-internal-scenarios"

describe("listInternalScenarios", () => {
  it("lists internal scenarios", () => {
    const result = listInternalScenarios()

    expect(result.summary.totalScenarios).toBeGreaterThanOrEqual(10)
  })
})
