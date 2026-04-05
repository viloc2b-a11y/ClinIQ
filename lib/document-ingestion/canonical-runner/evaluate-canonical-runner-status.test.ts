import { describe, expect, it } from "vitest"

import { evaluateCanonicalRunnerStatus } from "./evaluate-canonical-runner-status"

describe("evaluateCanonicalRunnerStatus", () => {
  it("returns ready when all canonical runner layers are ready", () => {
    const result = evaluateCanonicalRunnerStatus({
      route: "excel_hardened",
      sourceType: "excel",
      documentReady: true,
      actionCenterReady: true,
      postPersistenceReady: true,
      revenueReady: true,
      outputsReady: true,
    })

    expect(result.data.status).toBe("ready")
  })

  it("blocks when excel does not use hardened route", () => {
    const result = evaluateCanonicalRunnerStatus({
      route: "legacy",
      sourceType: "excel",
      documentReady: true,
      actionCenterReady: true,
      postPersistenceReady: true,
      revenueReady: true,
      outputsReady: true,
    })

    expect(result.data.status).toBe("blocked")
  })
})
