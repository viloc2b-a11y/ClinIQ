export type PostPersistenceBindingStatus =
  | "ready"
  | "partial"
  | "blocked"

export type PostPersistenceBindingResult = {
  data: {
    persistedItems: Array<{
      id: string
      type: string
      title: string
      estimatedValue: number
      sourceTrace?: Record<string, unknown> | null
    }>
    recordsResult: unknown | null
    envelopesResult: unknown | null
    auditResult: unknown | null
    metricsResult: unknown | null
    adminSnapshotResult: unknown | null
    healthSnapshotResult: unknown | null
  }
  summary: {
    status: PostPersistenceBindingStatus
    totalPersistedItems: number
    recordsReady: boolean
    envelopesReady: boolean
    auditReady: boolean
    metricsReady: boolean
    snapshotsReady: boolean
  }
  warnings: Array<{
    code: string
    message: string
    severity: "info" | "warning" | "error"
  }>
}
