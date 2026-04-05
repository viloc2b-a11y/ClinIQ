export function buildCommercialSurface(params: {
  fileName: string | null
  sourceType: "excel" | "pdf" | "word" | "unknown"
  route: "excel_hardened" | "legacy" | "unknown"
  bridgeStatus?: string | null
  orchestrationStatus?: string | null
  actionCenterStatus?: string | null
  postPersistenceStatus?: string | null
  revenueStatus?: string | null
  revenueReady?: boolean
  outputsReady?: boolean
  warnings?: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}) {
  const warnings = Array.isArray(params.warnings) ? params.warnings : []

  const storyline = [
    "Document received",
    "Document routed through ingestion path",
    "Canonical records prepared",
    "Action Center chain executed",
    "Post-persistence operational chain completed",
    "Revenue chain evaluated",
    "Commercial outputs assembled",
  ]

  const statusCards = [
    { label: "File", value: params.fileName || "unknown" },
    { label: "Source Type", value: params.sourceType },
    { label: "Route", value: params.route },
    { label: "Bridge Status", value: params.bridgeStatus || "unknown" },
    { label: "Orchestration", value: params.orchestrationStatus || "unknown" },
    { label: "Action Center", value: params.actionCenterStatus || "unknown" },
    { label: "Post-Persistence", value: params.postPersistenceStatus || "unknown" },
    { label: "Revenue Status", value: params.revenueStatus || "unknown" },
    { label: "Revenue Ready", value: params.revenueReady === true },
    { label: "Outputs Ready", value: params.outputsReady === true },
  ]

  return {
    data: {
      commercialSurface: {
        storyline,
        statusCards,
        topWarnings: warnings.slice(0, 5),
      },
    },
    summary: {
      totalStatusCards: statusCards.length,
      totalWarnings: warnings.slice(0, 5).length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
