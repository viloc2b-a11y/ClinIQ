import { describe, expect, it } from "vitest"

import { formatScenarioCatalogText } from "./format-scenario-catalog-text"

describe("formatScenarioCatalogText", () => {
  it("formats scenario catalog text", () => {
    const result = formatScenarioCatalogText({
      catalog: {
        data: {
          entries: [
            {
              key: "budget_simple_happy_path",
              label: "Budget Simple Happy Path",
              description: "Simple case",
              fixtureType: "excel_simple_budget",
              tags: ["excel"],
              fileName: "simple-budget.xlsx",
              sourceType: "excel",
              route: "excel_hardened",
              status: "ready",
              outputsReady: true,
              artifactsReady: 8,
              totalWarnings: 1,
              documentKind: "sponsor_budget",
            },
          ],
        },
        summary: {
          totalEntries: 1,
          readyCount: 1,
          partialCount: 0,
          blockedCount: 0,
          outputsReadyCount: 1,
        },
        warnings: [],
      },
    })

    expect(result.data.text).toContain("ClinIQ scenario catalog")
    expect(result.data.text).toContain("budget_simple_happy_path")
  })
})
