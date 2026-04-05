import type { FeatureFlags } from "../../config/feature-flags"

export type ActionCenterDependencyHealth = {
  configured: boolean
  enabled: boolean
  mode: "safe" | "real"
}

export type ActionCenterHealthSnapshot = {
  generatedAt: string
  flags: FeatureFlags
  persistence: ActionCenterDependencyHealth
  envelopeStore: ActionCenterDependencyHealth
  auditStore: ActionCenterDependencyHealth
  metricsStore: ActionCenterDependencyHealth
  summary: {
    overallMode: "safe" | "real" | "mixed"
    realComponentsEnabled: number
    configuredComponents: number
  }
}
