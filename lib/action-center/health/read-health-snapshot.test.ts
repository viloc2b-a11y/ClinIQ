import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resetSupabaseClientCache } from "../../integrations/supabase/client"
import { readActionCenterHealthSnapshot } from "./read-health-snapshot"

describe("readActionCenterHealthSnapshot", () => {
  beforeEach(() => {
    delete process.env.CLINIQ_ENABLE_REAL_PERSISTENCE
    delete process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE
    delete process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE
    delete process.env.CLINIQ_ENABLE_REAL_METRICS_STORE
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    delete process.env.CLINIQ_ENABLE_REAL_PERSISTENCE
    delete process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE
    delete process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE
    delete process.env.CLINIQ_ENABLE_REAL_METRICS_STORE
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    resetSupabaseClientCache()
  })

  it("reads safe-mode health snapshot by default", async () => {
    const snapshot = await readActionCenterHealthSnapshot()

    expect(snapshot.flags).toEqual({
      enableRealPersistence: false,
      enableRealEnvelopeStore: false,
      enableRealAuditStore: false,
      enableRealMetricsStore: false,
    })

    expect(snapshot.summary).toEqual({
      overallMode: "safe",
      realComponentsEnabled: 0,
      configuredComponents: 0,
    })
  })

  it("reads mixed-mode health snapshot with partial real flags", async () => {
    process.env.CLINIQ_ENABLE_REAL_PERSISTENCE = "true"
    process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE = "true"
    process.env.SUPABASE_URL = "https://example.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key"

    const snapshot = await readActionCenterHealthSnapshot()

    expect(snapshot.summary).toEqual({
      overallMode: "mixed",
      realComponentsEnabled: 2,
      configuredComponents: 4,
    })

    expect(snapshot.persistence.mode).toBe("real")
    expect(snapshot.auditStore.mode).toBe("real")
    expect(snapshot.envelopeStore.mode).toBe("safe")
    expect(snapshot.metricsStore.mode).toBe("safe")
  })
})
