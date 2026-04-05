export function shouldPersistActionSeeds(params: {
  orchestratorStatus: "ready" | "partial" | "blocked"
  executionReady: boolean
  totalActionSeeds: number
}) {
  const allowed =
    (params.orchestratorStatus === "ready" || params.orchestratorStatus === "partial") &&
    params.executionReady === true &&
    params.totalActionSeeds > 0

  return {
    data: {
      allowed,
    },
    summary: {
      allowed,
    },
    warnings: allowed
      ? []
      : [
          {
            code: "action_seed_persist_not_allowed",
            message: "Action seeds cannot be persisted because orchestration is not eligible",
            severity: "warning" as const,
          },
        ],
  }
}
