import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringExecutionCorridorMarkerResult } from "../scenario-draft-authoring-execution-corridor-marker/types"
import { buildScenarioDraftAuthoringExecutionChannelCapsule } from "./build-scenario-draft-authoring-execution-channel-capsule"

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringExecutionCorridorMarkerResult["data"]["executionCorridorMarker"]
  >,
): ScenarioDraftAuthoringExecutionCorridorMarkerResult {
  return {
    data: {
      executionCorridorMarker: {
        corridorActive: true,
        sessionCode: "session-001",
        worksetCode: "workset-001",
        queueItemCode: "queue-item-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
        summary: {
          hasCorridorTarget: true,
          corridorBlocked: false,
        },
        ...overrides,
      },
    },
    summary: {
      corridorActive: overrides?.corridorActive ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringExecutionChannelCapsule", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(buildInput())

    expect(result).toEqual({
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
        },
      },
      summary: {
        channelActive: true,
        sessionCode: "session-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
      }),
    )

    expect(result.data.executionChannelCapsule.sessionCode).toBe("session-xyz")
    expect(result.data.executionChannelCapsule.worksetCode).toBe("workset-xyz")
    expect(result.data.executionChannelCapsule.queueItemCode).toBe("queue-item-xyz")
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.executionChannelCapsule.remainingSessionCount).toBe(7)
    expect(result.data.executionChannelCapsule.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("computes hasChannelTarget correctly when sessionCode exists", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ sessionCode: "session-123" }),
    )

    expect(result.data.executionChannelCapsule.summary.hasChannelTarget).toBe(true)
  })

  it("computes hasChannelTarget correctly when sessionCode is null", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ sessionCode: null }),
    )

    expect(result.data.executionChannelCapsule.summary.hasChannelTarget).toBe(false)
  })

  it("sets channelActive true when corridorActive is true", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ corridorActive: true }),
    )

    expect(result.data.executionChannelCapsule.channelActive).toBe(true)
  })

  it("sets channelActive false when corridorActive is false", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ corridorActive: false }),
    )

    expect(result.data.executionChannelCapsule.channelActive).toBe(false)
  })

  it("computes channelBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ corridorActive: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ corridorActive: false }),
    )

    expect(activeResult.data.executionChannelCapsule.summary.channelBlocked).toBe(false)
    expect(blockedResult.data.executionChannelCapsule.summary.channelBlocked).toBe(true)
  })

  it("emits a warning when channelActive is false", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ corridorActive: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_EXECUTION_CHANNEL_BLOCKED",
      message: "Scenario draft authoring execution channel capsule is not active and cannot proceed.",
      severity: "warning",
    })
  })

  it("emits an info warning when no execution-channel target exists", () => {
    const result = buildScenarioDraftAuthoringExecutionChannelCapsule(
      buildInput({ sessionCode: null }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_EXECUTION_CHANNEL_TARGET",
      message: "No execution channel target is available because no execution-corridor session target exists.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringExecutionChannelCapsule(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringExecutionChannelCapsule(input)
    const resultB = buildScenarioDraftAuthoringExecutionChannelCapsule(input)

    expect(resultA).toEqual(resultB)
  })
})
