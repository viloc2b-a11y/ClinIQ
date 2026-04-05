import { buildPostPersistenceWarning } from "./shared/build-post-persistence-warning"

export function evaluatePostPersistenceStatus(params: {
  recordsReady: boolean
  envelopesReady: boolean
  auditReady: boolean
  metricsReady: boolean
  snapshotsReady: boolean
  totalPersistedItems: number
}) {
  const warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }> = []

  let status: "ready" | "partial" | "blocked" = "ready"

  if (params.totalPersistedItems === 0 || !params.recordsReady) {
    warnings.push(
      buildPostPersistenceWarning({
        code: "post_persistence_blocked",
        message: "Post-persistence chain is blocked before records stage",
        severity: "error",
      })
    )
    status = "blocked"
  }

  if (
    status !== "blocked" &&
    (!params.envelopesReady ||
      !params.auditReady ||
      !params.metricsReady ||
      !params.snapshotsReady)
  ) {
    warnings.push(
      buildPostPersistenceWarning({
        code: "post_persistence_partial",
        message: "Post-persistence chain completed with partial downstream coverage",
        severity: "warning",
      })
    )
    status = "partial"
  }

  if (warnings.length === 0) {
    warnings.push(
      buildPostPersistenceWarning({
        code: "post_persistence_ready",
        message: "Persisted Action Center items completed downstream operational chain",
        severity: "info",
      })
    )
  }

  return {
    data: {
      status,
    },
    summary: {
      status,
      totalWarnings: warnings.length,
    },
    warnings,
  }
}
