import { describe, expect, it } from "vitest"

import { buildActionCenterHealthSnapshot } from "./build-health-snapshot"

describe("buildActionCenterHealthSnapshot", () => {
  it("builds safe-mode snapshot deterministically", () => {
    const snapshot = buildActionCenterHealthSnapshot({
      generatedAt: "2026-04-05T00:00:00.000Z",
      flags: {
        enableRealPersistence: false,
        enableRealEnvelopeStore: false,
        enableRealAuditStore: false,
        enableRealMetricsStore: false,
      },
      supabaseConfigured: false,
    })

    expect(snapshot).toEqual({
      generatedAt: "2026-04-05T00:00:00.000Z",
      flags: {
        enableRealPersistence: false,
        enableRealEnvelopeStore: false,
        enableRealAuditStore: false,
        enableRealMetricsStore: false,
      },
      persistence: {
        configured: false,
        enabled: false,
        mode: "safe",
      },
      envelopeStore: {
        configured: false,
        enabled: false,
        mode: "safe",
      },
      auditStore: {
        configured: false,
        enabled: false,
        mode: "safe",
      },
      metricsStore: {
        configured: false,
        enabled: false,
        mode: "safe",
      },
      summary: {
        overallMode: "safe",
        realComponentsEnabled: 0,
        configuredComponents: 0,
      },
    })
  })

  it("builds mixed-mode snapshot when some real flags are enabled", () => {
    const snapshot = buildActionCenterHealthSnapshot({
      generatedAt: "2026-04-05T00:00:00.000Z",
      flags: {
        enableRealPersistence: true,
        enableRealEnvelopeStore: false,
        enableRealAuditStore: true,
        enableRealMetricsStore: false,
      },
      supabaseConfigured: true,
    })

    expect(snapshot.summary).toEqual({
      overallMode: "mixed",
      realComponentsEnabled: 2,
      configuredComponents: 4,
    })
  })

  it("builds real-mode snapshot when all real flags are enabled", () => {
    const snapshot = buildActionCenterHealthSnapshot({
      generatedAt: "2026-04-05T00:00:00.000Z",
      flags: {
        enableRealPersistence: true,
        enableRealEnvelopeStore: true,
        enableRealAuditStore: true,
        enableRealMetricsStore: true,
      },
      supabaseConfigured: true,
    })

    expect(snapshot.summary).toEqual({
      overallMode: "real",
      realComponentsEnabled: 4,
      configuredComponents: 4,
    })
  })
})
