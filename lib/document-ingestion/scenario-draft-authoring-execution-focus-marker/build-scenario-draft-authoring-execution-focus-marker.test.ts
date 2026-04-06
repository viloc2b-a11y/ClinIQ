import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionRouteCapsuleResult } from "../scenario-draft-authoring-execution-route-capsule/types"
import { buildScenarioDraftAuthoringExecutionFocusMarker } from "./build-scenario-draft-authoring-execution-focus-marker"

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringExecutionRouteCapsuleResult["data"]["executionRouteCapsule"]
  >,
): ScenarioDraftAuthoringExecutionRouteCapsuleResult {
  return {
    data: {
      executionRouteCapsule: {
        routeActive: true,
        sessionCode: "session-001",
        worksetCode: "workset-001",
        queueItemCode: "queue-item-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
        summary: {
          hasRouteTarget: true,
          routeBlocked: false,
        },
        ...overrides,
      },
    },
    summary: {
      routeActive: overrides?.routeActive ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionFocusMarker", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(buildInput())

    expect(result).toEqual({
      data: {
        executionFocusMarker: {
          focusActive: true,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 3,
          totalPlannedItems: 10,
          summary: {
            hasFocusTarget: true,
            focusBlocked: false,
          },
        },
      },
      summary: {
        focusActive: true,
        sessionCode: "session-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
      }),
    )

    expect(result.data.executionFocusMarker.sessionCode).toBe("session-xyz")
    expect(result.data.executionFocusMarker.worksetCode).toBe("workset-xyz")
    expect(result.data.executionFocusMarker.queueItemCode).toBe("queue-item-xyz")
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.executionFocusMarker.remainingSessionCount).toBe(7)
    expect(result.data.executionFocusMarker.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("computes hasFocusTarget correctly when sessionCode exists", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ sessionCode: "session-123" }),
    )

    expect(result.data.executionFocusMarker.summary.hasFocusTarget).toBe(true)
  })

  it("computes hasFocusTarget correctly when sessionCode is null", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ sessionCode: null }),
    )

    expect(result.data.executionFocusMarker.summary.hasFocusTarget).toBe(false)
  })

  it("sets focusActive true when routeActive is true", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ routeActive: true }),
    )

    expect(result.data.executionFocusMarker.focusActive).toBe(true)
  })

  it("sets focusActive false when routeActive is false", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ routeActive: false }),
    )

    expect(result.data.executionFocusMarker.focusActive).toBe(false)
  })

  it("computes focusBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ routeActive: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ routeActive: false }),
    )

    expect(activeResult.data.executionFocusMarker.summary.focusBlocked).toBe(false)
    expect(blockedResult.data.executionFocusMarker.summary.focusBlocked).toBe(true)
  })

  it("emits a warning when focusActive is false", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ routeActive: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_EXECUTION_FOCUS_BLOCKED",
      message: "Scenario draft authoring execution focus marker is not active and cannot proceed.",
      severity: "warning",
    })
  })

  it("emits an info warning when no execution-focus target exists", () => {
    const result = buildScenarioDraftAuthoringExecutionFocusMarker(
      buildInput({ sessionCode: null }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_EXECUTION_FOCUS_TARGET",
      message: "No execution focus target is available because no execution-route session target exists.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringExecutionFocusMarker(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringExecutionFocusMarker(input)
    const resultB = buildScenarioDraftAuthoringExecutionFocusMarker(input)

    expect(resultA).toEqual(resultB)
  })
})
