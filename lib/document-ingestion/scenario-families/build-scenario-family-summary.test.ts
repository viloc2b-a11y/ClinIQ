import { describe, expect, it } from "vitest"

import { buildScenarioFamilySummary } from "./build-scenario-family-summary"

describe("buildScenarioFamilySummary", () => {
  it("builds grouped summary for a scenario family", () => {
    const result = buildScenarioFamilySummary({
      family: {
        key: "happy_path",
        label: "Happy Path",
        description: "desc",
        scenarioKeys: ["budget_simple_happy_path", "soa_simple_happy_path"],
      },
      entries: [
        {
          key: "budget_simple_happy_path",
          label: "A",
          description: "A",
          fixtureType: "excel_simple_budget",
          tags: ["excel"],
          fileName: "a.xlsx",
          sourceType: "excel",
          route: "excel_hardened",
          status: "ready",
          outputsReady: true,
          artifactsReady: 8,
          totalWarnings: 1,
          documentKind: "sponsor_budget",
        },
        {
          key: "soa_simple_happy_path",
          label: "B",
          description: "B",
          fixtureType: "excel_simple_soa",
          tags: ["excel"],
          fileName: "b.xlsx",
          sourceType: "excel",
          route: "excel_hardened",
          status: "partial",
          outputsReady: false,
          artifactsReady: 4,
          totalWarnings: 2,
          documentKind: "soa",
        },
      ],
    })

    expect(result.totalScenarios).toBe(2)
    expect(result.readyCount).toBe(1)
    expect(result.partialCount).toBe(1)
  })
})
