import type { FeatureFlags } from "../../config/feature-flags"
import type {
  ActionCenterDependencyHealth,
  ActionCenterHealthSnapshot,
} from "./types"

function buildDependencyHealth(input: {
  configured: boolean
  enabled: boolean
}): ActionCenterDependencyHealth {
  return {
    configured: input.configured,
    enabled: input.enabled,
    mode: input.enabled ? "real" : "safe",
  }
}

export function buildActionCenterHealthSnapshot(input: {
  generatedAt?: string
  flags: FeatureFlags
  supabaseConfigured: boolean
}): ActionCenterHealthSnapshot {
  const generatedAt = input.generatedAt || new Date().toISOString()

  const persistence = buildDependencyHealth({
    configured: input.supabaseConfigured,
    enabled: input.flags.enableRealPersistence,
  })

  const envelopeStore = buildDependencyHealth({
    configured: input.supabaseConfigured,
    enabled: input.flags.enableRealEnvelopeStore,
  })

  const auditStore = buildDependencyHealth({
    configured: input.supabaseConfigured,
    enabled: input.flags.enableRealAuditStore,
  })

  const metricsStore = buildDependencyHealth({
    configured: input.supabaseConfigured,
    enabled: input.flags.enableRealMetricsStore,
  })

  const components = [persistence, envelopeStore, auditStore, metricsStore]
  const realComponentsEnabled = components.filter((c) => c.enabled).length
  const configuredComponents = components.filter((c) => c.configured).length

  const overallMode =
    realComponentsEnabled === 0
      ? "safe"
      : realComponentsEnabled === components.length
        ? "real"
        : "mixed"

  return {
    generatedAt,
    flags: input.flags,
    persistence,
    envelopeStore,
    auditStore,
    metricsStore,
    summary: {
      overallMode,
      realComponentsEnabled,
      configuredComponents,
    },
  }
}
