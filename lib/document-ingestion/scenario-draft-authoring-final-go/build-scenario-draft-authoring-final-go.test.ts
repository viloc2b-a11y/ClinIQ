import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringCommitCardResult } from "../scenario-draft-authoring-commit-card/types"
import { buildScenarioDraftAuthoringFinalGo } from "./build-scenario-draft-authoring-final-go"

function commitCardResult(args: {
  firstSessionCode: string | null
  firstWorksetCode: string | null
  firstQueueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
  readinessStatus: ScenarioDraftAuthoringCommitCardResult["summary"]["readinessStatus"]
  kickoffReady: boolean
  launchReady: boolean
  startNow: boolean
  startReady: boolean
  actNow: boolean
  confirmed: boolean
  committed: boolean
}): ScenarioDraftAuthoringCommitCardResult {
  const hasCommittedTarget = args.firstSessionCode !== null
  const commitBlocked = !args.committed
  return {
    data: {
      commitCard: {
        readinessStatus: args.readinessStatus,
        kickoffReady: args.kickoffReady,
        launchReady: args.launchReady,
        startNow: args.startNow,
        startReady: args.startReady,
        actNow: args.actNow,
        confirmed: args.confirmed,
        committed: args.committed,
        firstSessionCode: args.firstSessionCode,
        firstWorksetCode: args.firstWorksetCode,
        firstQueueItemCode: args.firstQueueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasCommittedTarget,
          commitBlocked,
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
      committed: args.committed,
      firstSessionCode: args.firstSessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringFinalGo", () => {
  it("copies commit card fields; finalGo true when committed and session exist", () => {
    const cc = commitCardResult({
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
      committed: true,
    })
    const r = buildScenarioDraftAuthoringFinalGo(cc)

    expect(r.data.finalGoCard.firstSessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.finalGoCard.firstWorksetCode).toBe("WS_A")
    expect(r.data.finalGoCard.firstQueueItemCode).toBe("Q_START")
    expect(r.data.finalGoCard.remainingSessionCount).toBe(2)
    expect(r.data.finalGoCard.totalPlannedItems).toBe(10)
    expect(r.data.finalGoCard.summary.hasFinalGoTarget).toBe(true)
    expect(r.data.finalGoCard.finalGo).toBe(true)
    expect(r.data.finalGoCard.summary.finalGoBlocked).toBe(false)
    expect(r.data.finalGoCard.summary.totalSessions).toBe(2)
    expect(r.summary.finalGo).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FINAL_GO_NOT_READY")).toBe(false)
    expect(r.warnings.some((w) => w.code === "NO_FINAL_GO_TARGET")).toBe(false)
  })

  it("finalGo false when committed is false", () => {
    const cc = commitCardResult({
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
      committed: false,
    })
    const r = buildScenarioDraftAuthoringFinalGo(cc)
    expect(r.data.finalGoCard.finalGo).toBe(false)
    expect(r.data.finalGoCard.summary.finalGoBlocked).toBe(true)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FINAL_GO_NOT_READY")).toBe(true)
  })

  it("finalGo false when no first session even if committed true", () => {
    const cc = commitCardResult({
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
      committed: true,
    })
    const r = buildScenarioDraftAuthoringFinalGo(cc)
    expect(r.data.finalGoCard.finalGo).toBe(false)
    expect(r.data.finalGoCard.summary.hasFinalGoTarget).toBe(false)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FINAL_GO_NOT_READY")).toBe(true)
    expect(r.warnings.some((w) => w.code === "NO_FINAL_GO_TARGET" && w.severity === "info")).toBe(true)
  })

  it("warning when readinessStatus is ready_with_warnings", () => {
    const cc = commitCardResult({
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
      committed: true,
    })
    const r = buildScenarioDraftAuthoringFinalGo(cc)
    expect(r.warnings.some((w) => w.code === "AUTHORING_FINAL_GO_READY_WITH_WARNINGS")).toBe(true)
  })

  it("does not mutate commit card result", () => {
    const cc = commitCardResult({
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
      committed: true,
    })
    const snap = structuredClone(cc)
    buildScenarioDraftAuthoringFinalGo(cc)
    expect(cc).toEqual(snap)
  })

  it("is deterministic", () => {
    const cc = commitCardResult({
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
      committed: true,
    })
    expect(buildScenarioDraftAuthoringFinalGo(cc)).toEqual(buildScenarioDraftAuthoringFinalGo(cc))
  })
})
