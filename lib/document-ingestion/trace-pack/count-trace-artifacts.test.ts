import { describe, expect, it } from "vitest"

import { countTraceArtifacts } from "./count-trace-artifacts"

describe("countTraceArtifacts", () => {
  it("counts ready trace artifacts", () => {
    const result = countTraceArtifacts({
      outputs: {
        report: {},
        executiveSummary: {},
        email: null,
        pdfPayload: {},
        htmlReport: null,
        dashboardCards: {},
        sendReportPayload: {},
        demoSurface: null,
      },
    })

    expect(result.data.artifactsReady).toBe(5)
  })
})
