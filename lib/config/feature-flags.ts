export type FeatureFlags = {
  enableRealPersistence: boolean
  enableRealEnvelopeStore: boolean
  enableRealAuditStore: boolean
  enableRealMetricsStore: boolean
}

export function getFeatureFlags(): FeatureFlags {
  return {
    enableRealPersistence:
      process.env.CLINIQ_ENABLE_REAL_PERSISTENCE === "true",
    enableRealEnvelopeStore:
      process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE === "true",
    enableRealAuditStore:
      process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE === "true",
    enableRealMetricsStore:
      process.env.CLINIQ_ENABLE_REAL_METRICS_STORE === "true",
  }
}
