import { describe, expect, it } from "vitest"

import { formatScenarioFamilyText } from "./format-scenario-family-text"

describe("formatScenarioFamilyText", () => {
  it("formats scenario family text", () => {
    const result = formatScenarioFamilyText({
      result: {
        data: {
          families: [
            {
              key: "happy_path",
              label: "Happy Path",
              description: "desc",
              totalScenarios: 2,
              readyCount: 2,
              partialCount: 0,
              blockedCount: 0,
              outputsReadyCount: 2,
              scenarioKeys: ["budget_simple_happy_path", "soa_simple_happy_path"],
            },
          ],
        },
        summary: {
          totalFamilies: 1,
          totalScenarios: 2,
          readyCount: 2,
          partialCount: 0,
          blockedCount: 0,
        },
        warnings: [],
      },
    })

    expect(result.data.text).toContain("ClinIQ scenario families")
    expect(result.data.text).toContain("happy_path")
  })
})
