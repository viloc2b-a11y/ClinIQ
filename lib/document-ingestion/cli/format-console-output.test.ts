import { describe, expect, it } from "vitest"

import { formatConsoleOutput } from "./format-console-output"

describe("formatConsoleOutput", () => {
  it("formats console output text", () => {
    const result = formatConsoleOutput({
      consoleView: {
        headline: "ClinIQ canonical demo: budget.xlsx",
        status: "ready",
        readiness: [
          { label: "Source Type", value: "excel" },
          { label: "Route", value: "excel_hardened" },
        ],
        topWarnings: [],
      },
    })

    expect(result.data.text).toContain("ClinIQ canonical demo")
    expect(result.data.text).toContain("Source Type")
  })
})
