import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringAssignmentPacketResult } from "../scenario-draft-authoring-assignment-packet/types"
import { buildScenarioDraftAuthoringDraftScaffoldContract } from "./build-scenario-draft-authoring-draft-scaffold-contract"

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringAssignmentPacketResult["data"]["assignmentPacket"]
  >,
): ScenarioDraftAuthoringAssignmentPacketResult {
  return {
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
        ...overrides,
      },
    },
    summary: {
      assignmentReady: overrides?.assignmentReady ?? true,
      sessionCode: overrides?.sessionCode ?? "session-001",
      queueItemCode: overrides?.queueItemCode ?? "queue-item-001",
      remainingSessionCount: overrides?.remainingSessionCount ?? 3,
      totalPlannedItems: overrides?.totalPlannedItems ?? 10,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringDraftScaffoldContract", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(buildInput())

    expect(result).toEqual({
      data: {
        draftScaffoldContract: {
          scaffoldReady: true,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 3,
          totalPlannedItems: 10,
          scaffoldTarget: {
            sessionCode: "session-001",
            worksetCode: "workset-001",
            queueItemCode: "queue-item-001",
          },
          scaffold: {
            title: null,
            objective: null,
            trigger: null,
            expectedBehavior: null,
            edgeCases: [],
          },
          summary: {
            hasScaffoldTarget: true,
            scaffoldBlocked: false,
            scaffoldIsEmpty: true,
          },
        },
      },
      summary: {
        scaffoldReady: true,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        scaffoldIsEmpty: true,
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_DRAFT_SCAFFOLD_EMPTY",
          message: "Draft scaffold is intentionally empty and awaits human authoring input.",
          severity: "info",
        },
      ],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
        assignmentTarget: {
          sessionCode: "session-xyz",
          worksetCode: "workset-xyz",
          queueItemCode: "queue-item-xyz",
        },
      }),
    )

    expect(result.data.draftScaffoldContract.sessionCode).toBe("session-xyz")
    expect(result.data.draftScaffoldContract.worksetCode).toBe("workset-xyz")
    expect(result.data.draftScaffoldContract.queueItemCode).toBe("queue-item-xyz")
    expect(result.data.draftScaffoldContract.scaffoldTarget).toEqual({
      sessionCode: "session-xyz",
      worksetCode: "workset-xyz",
      queueItemCode: "queue-item-xyz",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.draftScaffoldContract.remainingSessionCount).toBe(7)
    expect(result.data.draftScaffoldContract.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("initializes scaffold fields as empty", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(buildInput())

    expect(result.data.draftScaffoldContract.scaffold).toEqual({
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
    })
  })

  it("computes hasScaffoldTarget correctly when queueItemCode exists", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({ queueItemCode: "queue-item-123" }),
    )

    expect(result.data.draftScaffoldContract.summary.hasScaffoldTarget).toBe(true)
  })

  it("computes hasScaffoldTarget correctly when queueItemCode is null", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({
        queueItemCode: null,
        assignmentTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )

    expect(result.data.draftScaffoldContract.summary.hasScaffoldTarget).toBe(false)
  })

  it("sets scaffoldReady true when assignmentReady is true", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({ assignmentReady: true }),
    )

    expect(result.data.draftScaffoldContract.scaffoldReady).toBe(true)
  })

  it("sets scaffoldReady false when assignmentReady is false", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({ assignmentReady: false }),
    )

    expect(result.data.draftScaffoldContract.scaffoldReady).toBe(false)
  })

  it("computes scaffoldBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({ assignmentReady: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({ assignmentReady: false }),
    )

    expect(activeResult.data.draftScaffoldContract.summary.scaffoldBlocked).toBe(false)
    expect(blockedResult.data.draftScaffoldContract.summary.scaffoldBlocked).toBe(true)
  })

  it("scaffoldIsEmpty is true on contract and summary", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(buildInput())

    expect(result.data.draftScaffoldContract.summary.scaffoldIsEmpty).toBe(true)
    expect(result.summary.scaffoldIsEmpty).toBe(true)
  })

  it("emits a warning when scaffoldReady is false", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({ assignmentReady: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_DRAFT_SCAFFOLD_BLOCKED",
      message: "Scenario draft authoring draft scaffold contract is not ready for downstream drafting use.",
      severity: "warning",
    })
  })

  it("emits an info warning when no queue item target exists", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(
      buildInput({
        queueItemCode: null,
        assignmentTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_DRAFT_SCAFFOLD_TARGET",
      message: "No authoring draft scaffold target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits an info warning for intentionally empty scaffold", () => {
    const result = buildScenarioDraftAuthoringDraftScaffoldContract(buildInput())

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_DRAFT_SCAFFOLD_EMPTY",
      message: "Draft scaffold is intentionally empty and awaits human authoring input.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringDraftScaffoldContract(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringDraftScaffoldContract(input)
    const resultB = buildScenarioDraftAuthoringDraftScaffoldContract(input)

    expect(resultA).toEqual(resultB)
  })
})
