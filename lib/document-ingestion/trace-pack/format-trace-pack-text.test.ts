import { describe, expect, it } from "vitest"

import { formatTracePackText } from "./format-trace-pack-text"

describe("formatTracePackText", () => {
  it("formats trace pack text", () => {
    const result = formatTracePackText({
      tracePack: {
        data: {
          scenario: {
            key: "budget_simple_happy_path",
            label: "Budget Simple Happy Path",
            fixtureType: "excel_simple_budget",
            fileName: "simple-budget.xlsx",
          },
          trace: {
            source: {
              sourceType: "excel",
              route: "excel_hardened",
            },
            readiness: {
              status: "ready",
              documentReady: true,
              actionCenterReady: true,
              postPersistenceReady: true,
              revenueReady: true,
              outputsReady: true,
            },
            pipelineSnapshot: {
              bridgeStatus: "ready",
              orchestrationStatus: "ready",
              actionCenterStatus: "persisted",
              postPersistenceStatus: "ready",
              revenueStatus: "ready",
            },
            outputsSnapshot: {
              artifactsReady: 8,
            },
            warningsSnapshot: [],
          },
        },
      },
    })

    expect(result.data.text).toContain("ClinIQ trace pack")
    expect(result.data.text).toContain("Artifacts Ready")
  })
})
