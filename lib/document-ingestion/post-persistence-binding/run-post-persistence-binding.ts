import { buildPersistedItemsInput } from "./build-persisted-items-input"
import { shouldRunPostPersistenceChain } from "./should-run-post-persistence-chain"
import { buildRecordsChainInput } from "./build-records-chain-input"
import { evaluatePostPersistenceStatus } from "./evaluate-post-persistence-status"

export function runPostPersistenceBinding(params: {
  actionFlow: {
    data: {
      actionCenter: {
        data: {
          persistableSeeds: Array<{
            seedId: string
            type: string
            title: string
            estimatedValue: number
            sourceTrace?: Record<string, unknown> | null
          }>
          writePayload: {
            items: Array<{
              id: string
              type: string
              title: string
              estimatedValue: number
              sourceTrace?: Record<string, unknown> | null
            }>
          } | null
          verificationResult: unknown | null
        }
        summary: {
          status: "persisted" | "skipped" | "failed"
          attemptedWrite: boolean
          verified: boolean
        }
      }
    }
  }
  runRecordsStage?: (input: {
    recordsInput: Array<{
      actionItemId: string
      type: string
      title: string
      estimatedValue: number
      sourceTrace?: Record<string, unknown> | null
    }>
  }) => unknown
  runEnvelopesStage?: (recordsResult: unknown) => unknown
  runAuditStage?: (envelopesResult: unknown) => unknown
  runMetricsStage?: (auditResult: unknown) => unknown
  runAdminSnapshotStage?: (metricsResult: unknown) => unknown
  runHealthSnapshotStage?: (metricsResult: unknown) => unknown
}) {
  const persisted = buildPersistedItemsInput({
    actionCenter: params.actionFlow.data.actionCenter,
  })

  const decision = shouldRunPostPersistenceChain({
    actionCenterStatus: params.actionFlow.data.actionCenter.summary.status,
    attemptedWrite: params.actionFlow.data.actionCenter.summary.attemptedWrite,
    verified: params.actionFlow.data.actionCenter.summary.verified,
    hasVerificationResult:
      params.actionFlow.data.actionCenter.data.verificationResult != null,
  })

  if (!decision.data.allowed) {
    return {
      data: {
        persistedItems: persisted.data.items,
        recordsResult: null,
        envelopesResult: null,
        auditResult: null,
        metricsResult: null,
        adminSnapshotResult: null,
        healthSnapshotResult: null,
      },
      summary: {
        status: "blocked" as const,
        totalPersistedItems: persisted.summary.totalItems,
        recordsReady: false,
        envelopesReady: false,
        auditReady: false,
        metricsReady: false,
        snapshotsReady: false,
      },
      warnings: [...persisted.warnings, ...decision.warnings],
    }
  }

  const recordsInput = buildRecordsChainInput({
    items: persisted.data.items,
  })

  const recordsResult = params.runRecordsStage
    ? params.runRecordsStage({
        recordsInput: recordsInput.data.recordsInput,
      })
    : null

  const envelopesResult =
    params.runEnvelopesStage && recordsResult != null
      ? params.runEnvelopesStage(recordsResult)
      : null

  const auditResult =
    params.runAuditStage && envelopesResult != null
      ? params.runAuditStage(envelopesResult)
      : null

  const metricsResult =
    params.runMetricsStage && auditResult != null
      ? params.runMetricsStage(auditResult)
      : null

  const adminSnapshotResult =
    params.runAdminSnapshotStage && metricsResult != null
      ? params.runAdminSnapshotStage(metricsResult)
      : null

  const healthSnapshotResult =
    params.runHealthSnapshotStage && metricsResult != null
      ? params.runHealthSnapshotStage(metricsResult)
      : null

  const status = evaluatePostPersistenceStatus({
    recordsReady: recordsResult != null,
    envelopesReady: envelopesResult != null,
    auditReady: auditResult != null,
    metricsReady: metricsResult != null,
    snapshotsReady:
      adminSnapshotResult != null && healthSnapshotResult != null,
    totalPersistedItems: persisted.summary.totalItems,
  })

  return {
    data: {
      persistedItems: persisted.data.items,
      recordsResult,
      envelopesResult,
      auditResult,
      metricsResult,
      adminSnapshotResult,
      healthSnapshotResult,
    },
    summary: {
      status: status.data.status,
      totalPersistedItems: persisted.summary.totalItems,
      recordsReady: recordsResult != null,
      envelopesReady: envelopesResult != null,
      auditReady: auditResult != null,
      metricsReady: metricsResult != null,
      snapshotsReady:
        adminSnapshotResult != null && healthSnapshotResult != null,
    },
    warnings: [...persisted.warnings, ...recordsInput.warnings, ...status.warnings],
  }
}
