import { describe, expect, it } from "vitest"

import { buildCanonicalDemoPayload } from "./build-canonical-demo-payload"

describe("buildCanonicalDemoPayload", () => {
  it("builds canonical demo payload from runner result", () => {
    const result = buildCanonicalDemoPayload({
      runnerResult: {
        data: {
          sourceInput: {
            fileName: "budget.xlsx",
            sourceType: "excel",
            route: "excel_hardened",
          },
          commercialSurface: {
            storyline: ["a", "b"],
            statusCards: [{ label: "Route", value: "excel_hardened" }],
            topWarnings: [],
          },
          outputs: {
            report: {},
            executiveSummary: {},
            email: {},
            pdfPayload: {},
            htmlReport: {},
            dashboardCards: {},
            sendReportPayload: {},
            demoSurface: {},
          },
        },
        summary: {
          status: "ready",
          sourceType: "excel",
          route: "excel_hardened",
          documentReady: true,
          actionCenterReady: true,
          postPersistenceReady: true,
          revenueReady: true,
          outputsReady: true,
        },
        warnings: [],
      },
    })

    expect(result.summary.status).toBe("ready")
    expect(result.summary.artifactsReady).toBe(8)
    expect(result.data.meta.generatedAt).toBe("2026-04-05T12:00:00.000Z")
  })
})
