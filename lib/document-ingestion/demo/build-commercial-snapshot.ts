import { buildCanonicalDemoWarning } from "./build-canonical-demo-warning"

export function buildCommercialSnapshot(params: {
  result: {
    summary: {
      sourceType: "excel" | "pdf" | "word" | "unknown"
      postPersistenceStatus?: "ready" | "partial" | "blocked"
      revenueStatus?: "ready" | "partial" | "blocked"
      revenueReady?: boolean
      outputsReady?: boolean
      recordsReady?: boolean
      metricsReady?: boolean
      actionCenterStatus?: string
    }
    warnings?: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
    data?: {
      revenue?: {
        data?: {
          report?: unknown
          dashboard?: unknown
          score?: unknown
          leakage?: unknown
          invoices?: unknown
          dashboardCards?: unknown
          demoSurface?: unknown
        }
      }
    }
  }
}) {
  const warnings = params.result.warnings || []

  const topWarnings = warnings.slice(0, 5)

  const storyline = [
    "Document received",
    "Document normalized into operational records",
    "Action Center items generated and persisted",
    "Operational records / envelopes / audit / metrics executed",
    "Revenue chain evaluated",
    "Commercial output surface prepared",
  ]

  const topMetrics = [
    { label: "Source Type", value: params.result.summary.sourceType },
    {
      label: "Post-Persistence Status",
      value: params.result.summary.postPersistenceStatus || "unknown",
    },
    {
      label: "Revenue Status",
      value: params.result.summary.revenueStatus || "unknown",
    },
    {
      label: "Records Ready",
      value: params.result.summary.recordsReady ? "yes" : "no",
    },
    {
      label: "Metrics Ready",
      value: params.result.summary.metricsReady ? "yes" : "no",
    },
    {
      label: "Outputs Ready",
      value: params.result.summary.outputsReady ? "yes" : "no",
    },
  ]

  return {
    data: {
      commercialSnapshot: {
        storyline,
        topMetrics,
        topWarnings,
      },
    },
    summary: {
      totalMetrics: topMetrics.length,
      totalWarnings: topWarnings.length,
    },
    warnings:
      topWarnings.length === 0
        ? [
            buildCanonicalDemoWarning({
              code: "commercial_snapshot_clean",
              message: "Commercial snapshot built with no warnings",
              severity: "info",
            }),
          ]
        : [],
  }
}
