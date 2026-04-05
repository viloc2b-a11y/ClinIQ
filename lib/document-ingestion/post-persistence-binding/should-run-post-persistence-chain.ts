export function shouldRunPostPersistenceChain(params: {
  actionCenterStatus: "persisted" | "skipped" | "failed"
  attemptedWrite: boolean
  verified: boolean
  hasVerificationResult: boolean
}) {
  const allowed =
    params.actionCenterStatus === "persisted" &&
    params.attemptedWrite === true &&
    (params.hasVerificationResult ? params.verified === true : true)

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
            code: "post_persistence_chain_not_allowed",
            message:
              "Post-persistence chain cannot continue because Action Center persistence conditions were not met",
            severity: "error" as const,
          },
        ],
  }
}
