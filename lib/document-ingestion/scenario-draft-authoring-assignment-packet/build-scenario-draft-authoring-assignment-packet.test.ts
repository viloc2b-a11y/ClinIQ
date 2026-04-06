import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringWorkPacketResult } from "../scenario-draft-authoring-work-packet/types"
import { buildScenarioDraftAuthoringAssignmentPacket } from "./build-scenario-draft-authoring-assignment-packet"

function buildInput(
  overrides?: Partial<ScenarioDraftAuthoringWorkPacketResult["data"]["workPacket"]>,
): ScenarioDraftAuthoringWorkPacketResult {
  return {
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
        ...overrides,
      },
    },
    summary: {
      packetReady: overrides?.packetReady ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      queueItemCode: overrides?.queueItemCode ?? "queue-item-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringAssignmentPacket", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(buildInput())

    expect(result).toEqual({
      data: {
        assignmentPacket: {
          assignmentReady: true,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 3,
          totalPlannedItems: 10,
          assignmentTarget: {
            sessionCode: "session-001",
            worksetCode: "workset-001",
            queueItemCode: "queue-item-001",
          },
          summary: {
            hasAssignmentTarget: true,
            assignmentBlocked: false,
          },
        },
      },
      summary: {
        assignmentReady: true,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
        packetTarget: {
          sessionCode: "session-xyz",
          worksetCode: "workset-xyz",
          queueItemCode: "queue-item-xyz",
        },
      }),
    )

    expect(result.data.assignmentPacket.sessionCode).toBe("session-xyz")
    expect(result.data.assignmentPacket.worksetCode).toBe("workset-xyz")
    expect(result.data.assignmentPacket.queueItemCode).toBe("queue-item-xyz")
    expect(result.data.assignmentPacket.assignmentTarget).toEqual({
      sessionCode: "session-xyz",
      worksetCode: "workset-xyz",
      queueItemCode: "queue-item-xyz",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.assignmentPacket.remainingSessionCount).toBe(7)
    expect(result.data.assignmentPacket.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("computes hasAssignmentTarget correctly when queueItemCode exists", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({ queueItemCode: "queue-item-123" }),
    )

    expect(result.data.assignmentPacket.summary.hasAssignmentTarget).toBe(true)
  })

  it("computes hasAssignmentTarget correctly when queueItemCode is null", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({
        queueItemCode: null,
        packetTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )

    expect(result.data.assignmentPacket.summary.hasAssignmentTarget).toBe(false)
  })

  it("sets assignmentReady true when packetReady is true", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({ packetReady: true }),
    )

    expect(result.data.assignmentPacket.assignmentReady).toBe(true)
  })

  it("sets assignmentReady false when packetReady is false", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({ packetReady: false }),
    )

    expect(result.data.assignmentPacket.assignmentReady).toBe(false)
  })

  it("computes assignmentBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({ packetReady: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({ packetReady: false }),
    )

    expect(activeResult.data.assignmentPacket.summary.assignmentBlocked).toBe(false)
    expect(blockedResult.data.assignmentPacket.summary.assignmentBlocked).toBe(true)
  })

  it("emits a warning when assignmentReady is false", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({ packetReady: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_ASSIGNMENT_PACKET_BLOCKED",
      message: "Scenario draft authoring assignment packet is not ready for downstream authoring assignment use.",
      severity: "warning",
    })
  })

  it("emits an info warning when no queue item target exists", () => {
    const result = buildScenarioDraftAuthoringAssignmentPacket(
      buildInput({
        queueItemCode: null,
        packetTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_ASSIGNMENT_PACKET_TARGET",
      message: "No authoring assignment packet target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringAssignmentPacket(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringAssignmentPacket(input)
    const resultB = buildScenarioDraftAuthoringAssignmentPacket(input)

    expect(resultA).toEqual(resultB)
  })
})
