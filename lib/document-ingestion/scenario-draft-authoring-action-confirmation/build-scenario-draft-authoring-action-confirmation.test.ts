import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringImmediateActionResult } from "../scenario-draft-authoring-immediate-action/types"
import { buildScenarioDraftAuthoringActionConfirmation } from "./build-scenario-draft-authoring-action-confirmation"

function immediateActionResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringImmediateActionResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
}): ScenarioDraftAuthoringImmediateActionResult {
  const hasImmediateActionTarget = args.firstSessionCode !== null
  const actionBlocked = !args.actNow
  return {
    data: {
      immediateActionCard: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        startReady: args.startReady,
        actNow: args.actNow,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasImmediateActionTarget,
          actionBlocked,
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
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringActionConfirmation", () => {
  it("copies immediate action fields; confirmed true when actNow and session exist", () => {
    const ia = immediateActionResult({
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
    })
    const r = buildScenarioDraftAuthoringActionConfirmation(ia)

    expect(r.data.confirmationSnapshot.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.confirmationSnapshot.firstWorksetCode).toBe("WS_A")
    expect(r.data.confirmationSnapshot.firstQueueItemCode).toBe("Q_START")
    expect(r.data.confirmationSnapshot.remainingSessionCount).toBe(2)
    expect(r.data.confirmationSnapshot.totalPlannedItems).toBe(10)
    expect(r.data.confirmationSnapshot.summary.hasConfirmedActionTarget).toBe(true)
    expect(r.data.confirmationSnapshot.confirmed).toBe(true)
    expect(r.data.confirmationSnapshot.summary.confirmationBlocked).toBe(false)
    expect(r.data.confirmationSnapshot.summary.totalSessions).toBe(2)
    expect(r.summary.confirmed).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_ACTION_CONFIRMATION_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_CONFIRMED_ACTION_TARGET")).toBe(false)
  })

  it("confirmed false when actNow is false", () => {
    const ia = immediateActionResult({
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
    })
    const r = buildScenarioDraftAuthoringActionConfirmation(ia)
    expect(r.data.confirmationSnapshot.confirmed).toBe(false)
    expect(r.data.confirmationSnapshot.summary.confirmationBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_ACTION_CONFIRMATION_NOT_READY")).toBe(true)
  })

  it("confirmed false when no first session even if actNow true", () => {
    const ia = immediateActionResult({
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
    })
    const r = buildScenarioDraftAuthoringActionConfirmation(ia)
    expect(r.data.confirmationSnapshot.confirmed).toBe(false)
    expect(r.data.confirmationSnapshot.summary.hasConfirmedActionTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_ACTION_CONFIRMATION_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_CONFIRMED_ACTION_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const ia = immediateActionResult({
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
    })
    const r = buildScenarioDraftAuthoringActionConfirmation(ia)
    expect(r.warnings.some((w) => w.code === "AUTHORING_ACTION_CONFIRMATION_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate immediate action result", () => {
    const ia = immediateActionResult({
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
    })
    const snap = structuredClone(ia)
    buildScenarioDraftAuthoringActionConfirmation(ia)
    expect(ia).toEqual(snap)
  })

  it("is deterministic", () => {
    const ia = immediateActionResult({
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
    })
    expect(buildScenarioDraftAuthoringActionConfirmation(ia)).toEqual(
      buildScenarioDraftAuthoringActionConfirmation(ia),
    )
  })
})
