export function shouldRunRevenueChain(params: {
  postPersistenceStatus: "ready" | "partial" | "blocked"
  recordsReady: boolean
  metricsReady: boolean
}) {
  const allowed =
    (params.postPersistenceStatus === "ready" ||
      params.postPersistenceStatus === "partial") &&
    params.recordsReady === true &&
    params.metricsReady === true

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
            code: "revenue_chain_not_allowed",
            message:
              "Revenue chain cannot continue because post-persistence chain is not eligible",
            severity: "error" as const,
          },
        ],
  }
}
