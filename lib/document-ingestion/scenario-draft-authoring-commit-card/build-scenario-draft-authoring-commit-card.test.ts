import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringActionConfirmationResult } from "../scenario-draft-authoring-action-confirmation/types"
import { buildScenarioDraftAuthoringCommitCard } from "./build-scenario-draft-authoring-commit-card"

function confirmationResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringActionConfirmationResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
}): ScenarioDraftAuthoringActionConfirmationResult {
  const hasConfirmedActionTarget = args.firstSessionCode !== null
  const confirmationBlocked = !args.confirmed
  return {
    data: {
      confirmationSnapshot: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        startReady: args.startReady,
        actNow: args.actNow,
        confirmed: args.confirmed,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasConfirmedActionTarget,
          confirmationBlocked,
          totalSessions: args.remainingSessionCount,
        },
      },
    },
    summary: {
      readinessStatus: args.readinessStatus,
      kickoffReady: args.kickoffReady,
      launchReady: args.launchReady,
      startNow: args.startNow,
      startReady: args.startReady,
      actNow: args.actNow,
      confirmed: args.confirmed,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringCommitCard", () => {
  it("copies confirmation fields; committed true when confirmed and session exist", () => {
    const cr = confirmationResult({
      firstSessionCode: "AUTHORING_SESSION_0001",
      firstWorksetCode: "WS_A",
      firstQueueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
      actNow: true,
      confirmed: true,
    })
    const r = buildScenarioDraftAuthoringCommitCard(cr)

    expect(r.data.commitCard.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.commitCard.firstWorksetCode).toBe("WS_A")
    expect(r.data.commitCard.firstQueueItemCode).toBe("Q_START")
    expect(r.data.commitCard.remainingSessionCount).toBe(2)
    expect(r.data.commitCard.totalPlannedItems).toBe(10)
    expect(r.data.commitCard.summary.hasCommittedTarget).toBe(true)
    expect(r.data.commitCard.committed).toBe(true)
    expect(r.data.commitCard.summary.commitBlocked).toBe(false)
    expect(r.data.commitCard.summary.totalSessions).toBe(2)
    expect(r.summary.committed).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_COMMIT_CARD_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_COMMITTED_TARGET")).toBe(false)
  })

  it("committed false when confirmed is false", () => {
    const cr = confirmationResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "not_ready",
      kickoffReady: false,
      launchReady: false,
      startNow: false,
      startReady: false,
      actNow: false,
      confirmed: false,
    })
    const r = buildScenarioDraftAuthoringCommitCard(cr)
    expect(r.data.commitCard.committed).toBe(false)
    expect(r.data.commitCard.summary.commitBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_COMMIT_CARD_NOT_READY")).toBe(true)
  })

  it("committed false when no first session even if confirmed true", () => {
    const cr = confirmationResult({
      firstSessionCode: null,
      firstWorksetCode: null,
      firstQueueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
      actNow: true,
      confirmed: true,
    })
    const r = buildScenarioDraftAuthoringCommitCard(cr)
    expect(r.data.commitCard.committed).toBe(false)
    expect(r.data.commitCard.summary.hasCommittedTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_COMMIT_CARD_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_COMMITTED_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const cr = confirmationResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready_with_warnings",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
      actNow: true,
      confirmed: true,
    })
    const r = buildScenarioDraftAuthoringCommitCard(cr)
    expect(r.warnings.some((w) => w.code === "AUTHORING_COMMIT_CARD_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate confirmation result", () => {
    const cr = confirmationResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
      actNow: true,
      confirmed: true,
    })
    const snap = structuredClone(cr)
    buildScenarioDraftAuthoringCommitCard(cr)
    expect(cr).toEqual(snap)
  })

  it("is deterministic", () => {
    const cr = confirmationResult({
      firstSessionCode: "S",
      firstWorksetCode: "W",
      firstQueueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
      readinessStatus: "ready",
      kickoffReady: true,
      launchReady: true,
      startNow: true,
      startReady: true,
      actNow: true,
      confirmed: true,
    })
    expect(buildScenarioDraftAuthoringCommitCard(cr)).toEqual(buildScenarioDraftAuthoringCommitCard(cr))
  })
})
