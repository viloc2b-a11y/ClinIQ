import { describe, expect, it } from "vitest"

import { formatScenarioMatrixText } from "./format-scenario-matrix-text"

describe("formatScenarioMatrixText", () => {
  it("formats scenario matrix text", () => {
    const result = formatScenarioMatrixText({
      matrix: {
        data: {
          rows: [
            {
              key: "budget_simple_happy_path",
              label: "Budget Simple Happy Path",
              fixtureType: "excel_simple_budget",
              fileName: "simple-budget.xlsx",
              status: "ready",
              sourceType: "excel",
              route: "excel_hardened",
              outputsReady: true,
              artifactsReady: 8,
              totalWarnings: 1,
            },
          ],
        },
        summary: {
          totalScenarios: 1,
          readyCount: 1,
          partialCount: 0,
          blockedCount: 0,
          outputsReadyCount: 1,
        },
        warnings: [],
      },
    })

    expect(result.data.text).toContain("ClinIQ scenario matrix")
    expect(result.data.text).toContain("budget_simple_happy_path")
  })
})
