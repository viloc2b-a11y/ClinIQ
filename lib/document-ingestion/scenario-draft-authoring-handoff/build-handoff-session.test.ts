import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringSession } from "../scenario-draft-authoring-session-plan/types"
import { buildHandoffSession } from "./build-handoff-session"

function session(position: number): ScenarioDraftAuthoringSession {
  return {
    sessionCode: `AUTHORING_SESSION_${String(position).padStart(4, "0")}`,
    sessionPosition: position,
    targetWorksetCode: `W${position}`,
    targetWorksetPosition: position,
    totalItems: 2,
    startQueuePosition: 1,
    endQueuePosition: 2,
    firstQueueItemCode: "Qa",
    lastQueueItemCode: "Qb",
  }
}

describe("buildHandoffSession", () => {
  it("matches contract and copies fields; first session flagged", () => {
    const s1 = session(1)
    const h = buildHandoffSession(s1)
    expect(h).toEqual({
      sessionCode: "AUTHORING_SESSION_0001",
      sessionPosition: 1,
      targetWorksetCode: "W1",
      targetWorksetPosition: 1,
      totalItems: 2,
      startQueuePosition: 1,
      endQueuePosition: 2,
      firstQueueItemCode: "Qa",
      lastQueueItemCode: "Qb",
      isFirstSession: true,
    })
  })

  it("non-first sessions are not flagged", () => {
    const h = buildHandoffSession(session(2))
    expect(h.isFirstSession).toBe(false)
  })

  it("is deterministic", () => {
    const s = session(1)
    expect(buildHandoffSession(s)).toEqual(buildHandoffSession(s))
  })

  it("does not mutate session", () => {
    const s = session(3)
    const snap = structuredClone(s)
    buildHandoffSession(s)
    expect(s).toEqual(snap)
  })
})
