import { describe, expect, it } from "vitest"

import { runPostPersistenceBinding } from "./run-post-persistence-binding"

describe("STEP 95 — post-persistence binding", () => {
  it("runs records to snapshots chain after verified persistence", () => {
    const result = runPostPersistenceBinding({
      actionFlow: {
        data: {
          actionCenter: {
            data: {
              persistableSeeds: [
                {
                  seedId: "seed-1",
                  type: "soa_activity_review",
                  title: "Screening — CBC",
                  estimatedValue: 125,
                },
              ],
              writePayload: {
                items: [
                  {
                    id: "seed-1",
                    type: "soa_activity_review",
                    title: "Screening — CBC",
                    estimatedValue: 125,
                  },
                ],
              },
              verificationResult: {
                totalExpected: 1,
                found: 1,
                missing: [],
                matched: ["seed-1"],
              },
            },
            summary: {
              status: "persisted",
              attemptedWrite: true,
              verified: true,
            },
          },
        },
      },
      runRecordsStage: ({ recordsInput }) => ({ ok: true, total: recordsInput.length }),
      runEnvelopesStage: (recordsResult) => ({ ok: true, from: recordsResult }),
      runAuditStage: (envelopesResult) => ({ ok: true, from: envelopesResult }),
      runMetricsStage: (auditResult) => ({ ok: true, from: auditResult }),
      runAdminSnapshotStage: (metricsResult) => ({ ok: true, from: metricsResult }),
      runHealthSnapshotStage: (metricsResult) => ({ ok: true, from: metricsResult }),
    })

    expect(result.summary.status === "ready" || result.summary.status === "partial").toBe(true)
    expect(result.summary.recordsReady).toBe(true)
    expect(result.summary.metricsReady).toBe(true)
    expect(result.summary.snapshotsReady).toBe(true)
  })

  it("blocks post-persistence chain when verification failed", () => {
    const result = runPostPersistenceBinding({
      actionFlow: {
        data: {
          actionCenter: {
            data: {
              persistableSeeds: [],
              writePayload: null,
              verificationResult: {
                totalExpected: 1,
                found: 0,
                missing: ["seed-1"],
                matched: [],
              },
            },
            summary: {
              status: "persisted",
              attemptedWrite: true,
              verified: false,
            },
          },
        },
      },
    })

    expect(result.summary.status).toBe("blocked")
    expect(result.summary.recordsReady).toBe(false)
  })
})
