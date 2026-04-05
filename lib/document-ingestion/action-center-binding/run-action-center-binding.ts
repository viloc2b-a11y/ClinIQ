import { buildPersistableActionSeeds } from "./build-persistable-action-seeds"
import { buildActionCenterWritePayload } from "./build-action-center-write-payload"
import { shouldPersistActionSeeds } from "./should-persist-action-seeds"
import { verifyActionSeedPersistence } from "./verify-action-seed-persistence"
import { buildActionCenterBindingWarning } from "./shared/build-action-center-binding-warning"

export function runActionCenterBinding(params: {
  orchestration: {
    data: {
      actionSeeds: Array<{
        seedId: string
        type: string
        title: string
        estimatedValue: number
        sourceTrace?: Record<string, unknown> | null
      }>
    }
    summary: {
      status: "ready" | "partial" | "blocked"
      totalActionSeeds: number
      executionReady: boolean
    }
  }
  persistActionCenterItems?: (payload: {
    items: Array<{
      id: string
      type: string
      title: string
      estimatedValue: number
      sourceTrace?: Record<string, unknown> | null
    }>
  }) => unknown
  verifyPersistedItems?: (params: { expectedIds: string[] }) => {
    found?: number
    missing?: string[]
    matched?: string[]
    totalExpected?: number
  }
}) {
  const seeds = buildPersistableActionSeeds({
    actionSeeds: params.orchestration.data.actionSeeds,
  })

  const writePayload = buildActionCenterWritePayload({
    seeds: seeds.data.persistableSeeds,
  })

  const decision = shouldPersistActionSeeds({
    orchestratorStatus: params.orchestration.summary.status,
    executionReady: params.orchestration.summary.executionReady,
    totalActionSeeds: params.orchestration.summary.totalActionSeeds,
  })

  if (!decision.data.allowed) {
    return {
      data: {
        persistableSeeds: seeds.data.persistableSeeds,
        writePayload: null,
        writeResult: null,
        verificationResult: null,
      },
      summary: {
        status: "skipped" as const,
        totalSeeds: seeds.summary.totalSeeds,
        attemptedWrite: false,
        verified: false,
      },
      warnings: [
        ...seeds.warnings,
        ...writePayload.warnings,
        ...decision.warnings,
      ],
    }
  }

  if (!params.persistActionCenterItems) {
    return {
      data: {
        persistableSeeds: seeds.data.persistableSeeds,
        writePayload: writePayload.data.writePayload,
        writeResult: null,
        verificationResult: null,
      },
      summary: {
        status: "failed" as const,
        totalSeeds: seeds.summary.totalSeeds,
        attemptedWrite: false,
        verified: false,
      },
      warnings: [
        ...seeds.warnings,
        ...writePayload.warnings,
        buildActionCenterBindingWarning({
          code: "missing_persist_function",
          message: "No Action Center persist function was provided",
          severity: "error",
        }),
      ],
    }
  }

  const writeResult = params.persistActionCenterItems(writePayload.data.writePayload)

  const expectedIds = seeds.data.persistableSeeds.map((s) => s.seedId)

  if (params.verifyPersistedItems) {
    const verificationResult = params.verifyPersistedItems({
      expectedIds,
    })

    const verification = verifyActionSeedPersistence({
      expectedIds,
      verificationResult: verificationResult as {
        found?: number
        missing?: string[]
        matched?: string[]
        totalExpected?: number
      } | null,
    })

    const verified = verification.summary.verified

    return {
      data: {
        persistableSeeds: seeds.data.persistableSeeds,
        writePayload: writePayload.data.writePayload,
        writeResult,
        verificationResult,
      },
      summary: {
        status: verified ? ("persisted" as const) : ("failed" as const),
        totalSeeds: seeds.summary.totalSeeds,
        attemptedWrite: true,
        verified,
      },
      warnings: [
        ...seeds.warnings,
        ...writePayload.warnings,
        ...verification.warnings,
      ],
    }
  }

  return {
    data: {
      persistableSeeds: seeds.data.persistableSeeds,
      writePayload: writePayload.data.writePayload,
      writeResult,
      verificationResult: null,
    },
    summary: {
      status: "persisted" as const,
      totalSeeds: seeds.summary.totalSeeds,
      attemptedWrite: true,
      verified: false,
    },
    warnings: [
      ...seeds.warnings,
      ...writePayload.warnings,
      buildActionCenterBindingWarning({
        code: "verification_not_provided",
        message: "Action seeds were written but no verification function was provided",
        severity: "warning",
      }),
    ],
  }
}
