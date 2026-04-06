import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionChannelCapsuleResult } from "../scenario-draft-authoring-execution-channel-capsule/types"
import { buildScenarioDraftAuthoringExecutionLaneMarker } from "./build-scenario-draft-authoring-execution-lane-marker"

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringExecutionChannelCapsuleResult["data"]["executionChannelCapsule"]
  >,
): ScenarioDraftAuthoringExecutionChannelCapsuleResult {
  return {
    data: {
      executionChannelCapsule: {
        channelActive: true,
        sessionCode: "session-001",
        worksetCode: "workset-001",
        queueItemCode: "queue-item-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
        summary: {
          hasChannelTarget: true,
          channelBlocked: false,
        },
        ...overrides,
      },
    },
    summary: {
      channelActive: overrides?.channelActive ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionLaneMarker", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(buildInput())

    expect(result).toEqual({
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
        },
      },
      summary: {
        laneActive: true,
        sessionCode: "session-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
      }),
    )

    expect(result.data.executionLaneMarker.sessionCode).toBe("session-xyz")
    expect(result.data.executionLaneMarker.worksetCode).toBe("workset-xyz")
    expect(result.data.executionLaneMarker.queueItemCode).toBe("queue-item-xyz")
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.executionLaneMarker.remainingSessionCount).toBe(7)
    expect(result.data.executionLaneMarker.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("computes hasLaneTarget correctly when sessionCode exists", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ sessionCode: "session-123" }),
    )

    expect(result.data.executionLaneMarker.summary.hasLaneTarget).toBe(true)
  })

  it("computes hasLaneTarget correctly when sessionCode is null", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ sessionCode: null }),
    )

    expect(result.data.executionLaneMarker.summary.hasLaneTarget).toBe(false)
  })

  it("sets laneActive true when channelActive is true", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ channelActive: true }),
    )

    expect(result.data.executionLaneMarker.laneActive).toBe(true)
  })

  it("sets laneActive false when channelActive is false", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ channelActive: false }),
    )

    expect(result.data.executionLaneMarker.laneActive).toBe(false)
  })

  it("computes laneBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ channelActive: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ channelActive: false }),
    )

    expect(activeResult.data.executionLaneMarker.summary.laneBlocked).toBe(false)
    expect(blockedResult.data.executionLaneMarker.summary.laneBlocked).toBe(true)
  })

  it("emits a warning when laneActive is false", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ channelActive: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_EXECUTION_LANE_BLOCKED",
      message: "Scenario draft authoring execution lane marker is not active and cannot proceed.",
      severity: "warning",
    })
  })

  it("emits an info warning when no execution-lane target exists", () => {
    const result = buildScenarioDraftAuthoringExecutionLaneMarker(
      buildInput({ sessionCode: null }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_EXECUTION_LANE_TARGET",
      message: "No execution lane target is available because no execution-channel session target exists.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringExecutionLaneMarker(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringExecutionLaneMarker(input)
    const resultB = buildScenarioDraftAuthoringExecutionLaneMarker(input)

    expect(resultA).toEqual(resultB)
  })
})
