import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult } from "../scenario-draft-authoring-authoring-ready-output-marker/types"
import { buildScenarioDraftAuthoringWorkPacket } from "./build-scenario-draft-authoring-work-packet"

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult["data"]["authoringReadyOutputMarker"]
  >,
): ScenarioDraftAuthoringAuthoringReadyOutputMarkerResult {
  return {
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
        ...overrides,
      },
    },
    summary: {
      readyForAuthoring: overrides?.readyForAuthoring ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringWorkPacket", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(buildInput())

    expect(result).toEqual({
      data: {
        workPacket: {
          packetReady: true,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 3,
          totalPlannedItems: 10,
          packetTarget: {
            sessionCode: "session-001",
            worksetCode: "workset-001",
            queueItemCode: "queue-item-001",
          },
          summary: {
            hasPacketTarget: true,
            packetBlocked: false,
          },
        },
      },
      summary: {
        packetReady: true,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
      }),
    )

    expect(result.data.workPacket.sessionCode).toBe("session-xyz")
    expect(result.data.workPacket.worksetCode).toBe("workset-xyz")
    expect(result.data.workPacket.queueItemCode).toBe("queue-item-xyz")
    expect(result.data.workPacket.packetTarget).toEqual({
      sessionCode: "session-xyz",
      worksetCode: "workset-xyz",
      queueItemCode: "queue-item-xyz",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.workPacket.remainingSessionCount).toBe(7)
    expect(result.data.workPacket.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("computes hasPacketTarget correctly when queueItemCode exists", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ queueItemCode: "queue-item-123" }),
    )

    expect(result.data.workPacket.summary.hasPacketTarget).toBe(true)
  })

  it("computes hasPacketTarget correctly when queueItemCode is null", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ queueItemCode: null }),
    )

    expect(result.data.workPacket.summary.hasPacketTarget).toBe(false)
  })

  it("sets packetReady true when readyForAuthoring is true", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ readyForAuthoring: true }),
    )

    expect(result.data.workPacket.packetReady).toBe(true)
  })

  it("sets packetReady false when readyForAuthoring is false", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ readyForAuthoring: false }),
    )

    expect(result.data.workPacket.packetReady).toBe(false)
  })

  it("computes packetBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ readyForAuthoring: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ readyForAuthoring: false }),
    )

    expect(activeResult.data.workPacket.summary.packetBlocked).toBe(false)
    expect(blockedResult.data.workPacket.summary.packetBlocked).toBe(true)
  })

  it("emits a warning when packetReady is false", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ readyForAuthoring: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_WORK_PACKET_BLOCKED",
      message: "Scenario draft authoring work packet is not ready for downstream authoring use.",
      severity: "warning",
    })
  })

  it("emits an info warning when no queue item target exists", () => {
    const result = buildScenarioDraftAuthoringWorkPacket(
      buildInput({ queueItemCode: null }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_WORK_PACKET_TARGET",
      message: "No authoring work packet target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringWorkPacket(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringWorkPacket(input)
    const resultB = buildScenarioDraftAuthoringWorkPacket(input)

    expect(resultA).toEqual(resultB)
  })
})
