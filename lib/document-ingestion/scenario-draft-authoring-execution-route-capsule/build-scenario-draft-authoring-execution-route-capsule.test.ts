import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionPathMarkerResult } from "../scenario-draft-authoring-execution-path-marker/types"
import { buildScenarioDraftAuthoringExecutionRouteCapsule } from "./build-scenario-draft-authoring-execution-route-capsule"

function pathMarkerResult(args: {
  pathActive: boolean
  sessionCode: string | null
  worksetCode: string | null
  queueItemCode: string | null
  remainingSessionCount: number
  totalPlannedItems: number
}): ScenarioDraftAuthoringExecutionPathMarkerResult {
  const hasPathTarget = args.sessionCode !== null
  const pathBlocked = !args.pathActive
  return {
    data: {
      executionPathMarker: {
        pathActive: args.pathActive,
        sessionCode: args.sessionCode,
        worksetCode: args.worksetCode,
        queueItemCode: args.queueItemCode,
        remainingSessionCount: args.remainingSessionCount,
        totalPlannedItems: args.totalPlannedItems,
        summary: {
          hasPathTarget,
          pathBlocked,
        },
      },
    },
    summary: {
      pathActive: args.pathActive,
      sessionCode: args.sessionCode,
      remainingSessionCount: args.remainingSessionCount,
      totalPlannedItems: args.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionRouteCapsule", () => {
  it("matches contract and copies path marker fields when route active", () => {
    const m = pathMarkerResult({
      pathActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      worksetCode: "WS_A",
      queueItemCode: "Q_START",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    const r = buildScenarioDraftAuthoringExecutionRouteCapsule(m)

    expect(r.data.executionRouteCapsule.routeActive).toBe(true)
    expect(r.data.executionRouteCapsule.sessionCode).toBe("AUTHORING_SESSION_0001")
    expect(r.data.executionRouteCapsule.worksetCode).toBe("WS_A")
    expect(r.data.executionRouteCapsule.queueItemCode).toBe("Q_START")
    expect(r.data.executionRouteCapsule.remainingSessionCount).toBe(2)
    expect(r.data.executionRouteCapsule.totalPlannedItems).toBe(10)
    expect(r.data.executionRouteCapsule.summary.hasRouteTarget).toBe(true)
    expect(r.data.executionRouteCapsule.summary.routeBlocked).toBe(false)
    expect(r.summary).toEqual({
      routeActive: true,
      sessionCode: "AUTHORING_SESSION_0001",
      remainingSessionCount: 2,
      totalPlannedItems: 10,
    })
    expect(r.warnings).toHaveLength(0)
  })

  it("routeActive false and routeBlocked when pathActive is false; warning emitted", () => {
    const m = pathMarkerResult({
      pathActive: false,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const r = buildScenarioDraftAuthoringExecutionRouteCapsule(m)
    expect(r.data.executionRouteCapsule.routeActive).toBe(false)
    expect(r.data.executionRouteCapsule.summary.routeBlocked).toBe(true)
    const w = r.warnings.find((x) => x.code === "AUTHORING_EXECUTION_ROUTE_BLOCKED")
    expect(w?.severity).toBe("warning")
    expect(w?.message).toBe(
      "Scenario draft authoring execution route capsule is not active and cannot proceed.",
    )
  })

  it("info warning when no execution-route target", () => {
    const m = pathMarkerResult({
      pathActive: false,
      sessionCode: null,
      worksetCode: null,
      queueItemCode: null,
      remainingSessionCount: 0,
      totalPlannedItems: 0,
    })
    const r = buildScenarioDraftAuthoringExecutionRouteCapsule(m)
    expect(r.data.executionRouteCapsule.summary.hasRouteTarget).toBe(false)
    const w = r.warnings.find((x) => x.code === "NO_EXECUTION_ROUTE_TARGET")
    expect(w?.severity).toBe("info")
    expect(w?.message).toBe(
      "No execution route target is available because no execution-path session target exists.",
    )
  })

  it("does not mutate execution path marker result", () => {
    const m = pathMarkerResult({
      pathActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    const snap = structuredClone(m)
    buildScenarioDraftAuthoringExecutionRouteCapsule(m)
    expect(m).toEqual(snap)
  })

  it("is deterministic", () => {
    const m = pathMarkerResult({
      pathActive: true,
      sessionCode: "S",
      worksetCode: "W",
      queueItemCode: "Q",
      remainingSessionCount: 1,
      totalPlannedItems: 1,
    })
    expect(buildScenarioDraftAuthoringExecutionRouteCapsule(m)).toEqual(
      buildScenarioDraftAuthoringExecutionRouteCapsule(m),
    )
  })
})
