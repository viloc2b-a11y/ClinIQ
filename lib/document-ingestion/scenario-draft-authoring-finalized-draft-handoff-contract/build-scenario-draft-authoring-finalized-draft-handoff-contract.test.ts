import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringFinalizedDraftOutputResult } from "../scenario-draft-authoring-finalized-draft-output/types"
import { buildScenarioDraftAuthoringFinalizedDraftHandoffContract } from "./build-scenario-draft-authoring-finalized-draft-handoff-contract"

const defaultFinalizedDraftOutput: ScenarioDraftAuthoringFinalizedDraftOutputResult["data"]["finalizedDraftOutput"] =
  {
    finalizedReady: false,
    sessionCode: "session-001",
    worksetCode: "workset-001",
    queueItemCode: "queue-item-001",
    remainingSessionCount: 1,
    totalPlannedItems: 10,
    finalizedTarget: {
      sessionCode: "session-001",
      worksetCode: "workset-001",
      queueItemCode: "queue-item-001",
    },
    finalizedFields: {
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
      completionNotes: null,
    },
    summary: {
      hasFinalizedTarget: true,
      finalizedBlocked: true,
      finalizedIsEmpty: true,
      finalizedMarkedComplete: false,
    },
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringFinalizedDraftOutputResult["data"]["finalizedDraftOutput"]
  >,
): ScenarioDraftAuthoringFinalizedDraftOutputResult {
  const finalizedDraftOutput = {
    ...defaultFinalizedDraftOutput,
    ...overrides,
    finalizedTarget: {
      sessionCode: overrides?.sessionCode ?? defaultFinalizedDraftOutput.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultFinalizedDraftOutput.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultFinalizedDraftOutput.queueItemCode,
      ...overrides?.finalizedTarget,
    },
    finalizedFields: {
      ...defaultFinalizedDraftOutput.finalizedFields,
      ...overrides?.finalizedFields,
      edgeCases: overrides?.finalizedFields?.edgeCases ?? [
        ...defaultFinalizedDraftOutput.finalizedFields.edgeCases,
      ],
    },
    summary: {
      ...defaultFinalizedDraftOutput.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { finalizedDraftOutput },
    summary: {
      finalizedReady: finalizedDraftOutput.finalizedReady,
      sessionCode: finalizedDraftOutput.sessionCode,
      queueItemCode: finalizedDraftOutput.queueItemCode,
      finalizedIsEmpty: finalizedDraftOutput.summary.finalizedIsEmpty,
      finalizedMarkedComplete: finalizedDraftOutput.summary.finalizedMarkedComplete,
      remainingSessionCount: finalizedDraftOutput.remainingSessionCount,
      totalPlannedItems: finalizedDraftOutput.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringFinalizedDraftHandoffContract", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput())

    expect(result).toEqual({
      data: {
        finalizedDraftHandoffContract: {
          handoffReady: false,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 1,
          totalPlannedItems: 10,
          handoffTarget: {
            sessionCode: "session-001",
            worksetCode: "workset-001",
            queueItemCode: "queue-item-001",
          },
          handoffPayload: {
            title: null,
            objective: null,
            trigger: null,
            expectedBehavior: null,
            edgeCases: [],
            completionNotes: null,
          },
          summary: {
            hasHandoffTarget: true,
            handoffBlocked: true,
            handoffIsEmpty: true,
            handoffMarkedComplete: false,
          },
        },
      },
      summary: {
        handoffReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        handoffIsEmpty: true,
        handoffMarkedComplete: false,
        remainingSessionCount: 1,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_BLOCKED",
          message: "Scenario draft finalized handoff contract is not ready for downstream packaging.",
          severity: "warning",
        },
        {
          code: "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_EMPTY",
          message:
            "Finalized draft handoff contract is empty and does not yet contain downstream handoff content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        sessionCode: "s-a",
        worksetCode: "w-b",
        queueItemCode: "q-c",
      }),
    )
    const c = result.data.finalizedDraftHandoffContract
    expect(c.sessionCode).toBe("s-a")
    expect(c.worksetCode).toBe("w-b")
    expect(c.queueItemCode).toBe("q-c")
  })

  it("copies handoffTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        sessionCode: "x",
        worksetCode: "y",
        queueItemCode: "z",
      }),
    )
    expect(result.data.finalizedDraftHandoffContract.handoffTarget).toEqual({
      sessionCode: "x",
      worksetCode: "y",
      queueItemCode: "z",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({ remainingSessionCount: 5, totalPlannedItems: 20 }),
    )
    expect(result.data.finalizedDraftHandoffContract.remainingSessionCount).toBe(5)
    expect(result.data.finalizedDraftHandoffContract.totalPlannedItems).toBe(20)
    expect(result.summary.remainingSessionCount).toBe(5)
    expect(result.summary.totalPlannedItems).toBe(20)
  })

  it("copies finalized fields into handoffPayload", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        finalizedFields: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["a"],
          completionNotes: "n",
        },
      }),
    )
    expect(result.data.finalizedDraftHandoffContract.handoffPayload).toEqual({
      title: "T",
      objective: "O",
      trigger: "Tr",
      expectedBehavior: "E",
      edgeCases: ["a"],
      completionNotes: "n",
    })
  })

  it("clones edgeCases so mutating output does not affect input", () => {
    const input = buildInput({
      finalizedFields: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["orig"],
        completionNotes: null,
      },
    })
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(input)
    result.data.finalizedDraftHandoffContract.handoffPayload.edgeCases.push("x")
    expect(input.data.finalizedDraftOutput.finalizedFields.edgeCases).toEqual(["orig"])
  })

  it("handoffReady mirrors finalizedReady", () => {
    expect(
      buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
        buildInput({ finalizedReady: false }),
      ).data.finalizedDraftHandoffContract.handoffReady,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
        buildInput({
          finalizedReady: true,
          summary: {
            hasFinalizedTarget: true,
            finalizedBlocked: false,
            finalizedIsEmpty: false,
            finalizedMarkedComplete: true,
          },
        }),
      ).data.finalizedDraftHandoffContract.handoffReady,
    ).toBe(true)
  })

  it("computes hasHandoffTarget from queueItemCode", () => {
    const withQ = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput())
    expect(withQ.data.finalizedDraftHandoffContract.summary.hasHandoffTarget).toBe(true)

    const noQ = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        queueItemCode: null,
        finalizedTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQ.data.finalizedDraftHandoffContract.summary.hasHandoffTarget).toBe(false)
  })

  it("computes handoffBlocked as negation of handoffReady", () => {
    const blocked = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput())
    expect(blocked.data.finalizedDraftHandoffContract.summary.handoffBlocked).toBe(true)

    const open = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        finalizedReady: true,
        summary: {
          hasFinalizedTarget: true,
          finalizedBlocked: false,
          finalizedIsEmpty: false,
          finalizedMarkedComplete: true,
        },
      }),
    )
    expect(open.data.finalizedDraftHandoffContract.summary.handoffBlocked).toBe(false)
  })

  it("handoffIsEmpty is true for fully empty payload", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput())
    expect(result.data.finalizedDraftHandoffContract.summary.handoffIsEmpty).toBe(true)
  })

  it("handoffIsEmpty is false for non-empty payload", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        finalizedFields: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["e"],
          completionNotes: null,
        },
      }),
    )
    expect(result.data.finalizedDraftHandoffContract.summary.handoffIsEmpty).toBe(false)
  })

  it("handoffMarkedComplete mirrors finalizedMarkedComplete", () => {
    expect(
      buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput()).data
        .finalizedDraftHandoffContract.summary.handoffMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
        buildInput({
          summary: {
            hasFinalizedTarget: true,
            finalizedBlocked: false,
            finalizedIsEmpty: false,
            finalizedMarkedComplete: true,
          },
        }),
      ).data.finalizedDraftHandoffContract.summary.handoffMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when handoffReady is false", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_BLOCKED",
      message: "Scenario draft finalized handoff contract is not ready for downstream packaging.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        queueItemCode: null,
        finalizedTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_TARGET",
      message:
        "No finalized draft handoff contract target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when handoff contract payload is empty", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_EMPTY",
      message:
        "Finalized draft handoff contract is empty and does not yet contain downstream handoff content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when payload has content", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftHandoffContract(
      buildInput({
        finalizedFields: {
          title: "t",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
          completionNotes: null,
        },
      }),
    )
    expect(
      result.warnings.some((w) => w.code === "AUTHORING_FINALIZED_DRAFT_HANDOFF_CONTRACT_EMPTY"),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      finalizedFields: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["z"],
        completionNotes: null,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringFinalizedDraftHandoffContract(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringFinalizedDraftHandoffContract(input)).toEqual(
      buildScenarioDraftAuthoringFinalizedDraftHandoffContract(input),
    )
  })
})
