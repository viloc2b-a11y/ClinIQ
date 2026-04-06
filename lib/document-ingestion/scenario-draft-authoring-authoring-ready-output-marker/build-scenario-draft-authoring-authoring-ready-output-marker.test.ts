import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionLaneMarkerResult } from "../scenario-draft-authoring-execution-lane-marker/types"
import { buildScenarioDraftAuthoringAuthoringReadyOutputMarker } from "./build-scenario-draft-authoring-authoring-ready-output-marker"

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringExecutionLaneMarkerResult["data"]["executionLaneMarker"]
  >,
): ScenarioDraftAuthoringExecutionLaneMarkerResult {
  return {
    data: {
      executionLaneMarker: {
        laneActive: true,
        sessionCode: "session-001",
        worksetCode: "workset-001",
        queueItemCode: "queue-item-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
        summary: {
          hasLaneTarget: true,
          laneBlocked: false,
        },
        ...overrides,
      },
    },
    summary: {
      laneActive: overrides?.laneActive ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringAuthoringReadyOutputMarker", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(buildInput())

    expect(result).toEqual({
      data: {
        authoringReadyOutputMarker: {
          readyForAuthoring: true,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 3,
          totalPlannedItems: 10,
          summary: {
            hasAuthoringTarget: true,
            authoringBlocked: false,
          },
        },
      },
      summary: {
        readyForAuthoring: true,
        sessionCode: "session-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
      }),
    )

    expect(result.data.authoringReadyOutputMarker.sessionCode).toBe("session-xyz")
    expect(result.data.authoringReadyOutputMarker.worksetCode).toBe("workset-xyz")
    expect(result.data.authoringReadyOutputMarker.queueItemCode).toBe("queue-item-xyz")
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.authoringReadyOutputMarker.remainingSessionCount).toBe(7)
    expect(result.data.authoringReadyOutputMarker.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("computes hasAuthoringTarget correctly when sessionCode exists", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ sessionCode: "session-123" }),
    )

    expect(result.data.authoringReadyOutputMarker.summary.hasAuthoringTarget).toBe(true)
  })

  it("computes hasAuthoringTarget correctly when sessionCode is null", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ sessionCode: null }),
    )

    expect(result.data.authoringReadyOutputMarker.summary.hasAuthoringTarget).toBe(false)
  })

  it("sets readyForAuthoring true when laneActive is true", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ laneActive: true }),
    )

    expect(result.data.authoringReadyOutputMarker.readyForAuthoring).toBe(true)
  })

  it("sets readyForAuthoring false when laneActive is false", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ laneActive: false }),
    )

    expect(result.data.authoringReadyOutputMarker.readyForAuthoring).toBe(false)
  })

  it("computes authoringBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ laneActive: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ laneActive: false }),
    )

    expect(activeResult.data.authoringReadyOutputMarker.summary.authoringBlocked).toBe(false)
    expect(blockedResult.data.authoringReadyOutputMarker.summary.authoringBlocked).toBe(true)
  })

  it("emits a warning when readyForAuthoring is false", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ laneActive: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_READY_OUTPUT_BLOCKED",
      message: "Scenario draft authoring ready output marker is not active for downstream authoring consumption.",
      severity: "warning",
    })
  })

  it("emits an info warning when no authoring-ready target exists", () => {
    const result = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(
      buildInput({ sessionCode: null }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_READY_OUTPUT_TARGET",
      message: "No authoring-ready output target is available because no execution-lane session target exists.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringAuthoringReadyOutputMarker(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(input)
    const resultB = buildScenarioDraftAuthoringAuthoringReadyOutputMarker(input)

    expect(resultA).toEqual(resultB)
  })
})
