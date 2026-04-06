import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringDraftCompletionTemplateResult } from "../scenario-draft-authoring-draft-completion-template/types"
import { buildScenarioDraftAuthoringFinalizedDraftOutput } from "./build-scenario-draft-authoring-finalized-draft-output"

const defaultDraftCompletionTemplate: ScenarioDraftAuthoringDraftCompletionTemplateResult["data"]["draftCompletionTemplate"] =
  {
    completionReady: true,
    sessionCode: "session-001",
    worksetCode: "workset-001",
    queueItemCode: "queue-item-001",
    remainingSessionCount: 2,
    totalPlannedItems: 10,
    completionTarget: {
      sessionCode: "session-001",
      worksetCode: "workset-001",
      queueItemCode: "queue-item-001",
    },
    completionFields: {
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
      completionNotes: null,
      isFinalized: false,
    },
    summary: {
      hasCompletionTarget: true,
      completionBlocked: false,
      completionIsEmpty: true,
      completionIsFinalized: false,
    },
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringDraftCompletionTemplateResult["data"]["draftCompletionTemplate"]
  >,
): ScenarioDraftAuthoringDraftCompletionTemplateResult {
  const draftCompletionTemplate = {
    ...defaultDraftCompletionTemplate,
    ...overrides,
    completionTarget: {
      sessionCode: overrides?.sessionCode ?? defaultDraftCompletionTemplate.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultDraftCompletionTemplate.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultDraftCompletionTemplate.queueItemCode,
      ...overrides?.completionTarget,
    },
    completionFields: {
      ...defaultDraftCompletionTemplate.completionFields,
      ...overrides?.completionFields,
      edgeCases: overrides?.completionFields?.edgeCases ?? [
        ...defaultDraftCompletionTemplate.completionFields.edgeCases,
      ],
    },
    summary: {
      ...defaultDraftCompletionTemplate.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { draftCompletionTemplate },
    summary: {
      completionReady: draftCompletionTemplate.completionReady,
      sessionCode: draftCompletionTemplate.sessionCode,
      queueItemCode: draftCompletionTemplate.queueItemCode,
      completionIsEmpty: draftCompletionTemplate.summary.completionIsEmpty,
      completionIsFinalized: draftCompletionTemplate.summary.completionIsFinalized,
      remainingSessionCount: draftCompletionTemplate.remainingSessionCount,
      totalPlannedItems: draftCompletionTemplate.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringFinalizedDraftOutput", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput())

    expect(result).toEqual({
      data: {
        finalizedDraftOutput: {
          finalizedReady: false,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 2,
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
        },
      },
      summary: {
        finalizedReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        finalizedIsEmpty: true,
        finalizedMarkedComplete: false,
        remainingSessionCount: 2,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_FINALIZED_DRAFT_OUTPUT_BLOCKED",
          message: "Scenario draft finalized output is not ready for downstream handoff.",
          severity: "warning",
        },
        {
          code: "AUTHORING_FINALIZED_DRAFT_OUTPUT_EMPTY",
          message:
            "Finalized draft output is empty and does not yet contain human-authored draft content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        sessionCode: "s-x",
        worksetCode: "w-y",
        queueItemCode: "q-z",
      }),
    )
    const out = result.data.finalizedDraftOutput
    expect(out.sessionCode).toBe("s-x")
    expect(out.worksetCode).toBe("w-y")
    expect(out.queueItemCode).toBe("q-z")
  })

  it("copies finalizedTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        sessionCode: "a",
        worksetCode: "b",
        queueItemCode: "c",
      }),
    )
    expect(result.data.finalizedDraftOutput.finalizedTarget).toEqual({
      sessionCode: "a",
      worksetCode: "b",
      queueItemCode: "c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({ remainingSessionCount: 7, totalPlannedItems: 99 }),
    )
    expect(result.data.finalizedDraftOutput.remainingSessionCount).toBe(7)
    expect(result.data.finalizedDraftOutput.totalPlannedItems).toBe(99)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(99)
  })

  it("copies completion fields into finalizedFields without isFinalized", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionFields: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["e1"],
          completionNotes: "notes",
          isFinalized: true,
        },
      }),
    )
    expect(result.data.finalizedDraftOutput.finalizedFields).toEqual({
      title: "T",
      objective: "O",
      trigger: "Tr",
      expectedBehavior: "E",
      edgeCases: ["e1"],
      completionNotes: "notes",
    })
    expect(
      "isFinalized" in result.data.finalizedDraftOutput.finalizedFields,
    ).toBe(false)
  })

  it("clones edgeCases so mutating output does not affect input", () => {
    const input = buildInput({
      completionFields: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["keep"],
        completionNotes: null,
        isFinalized: false,
      },
    })
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(input)
    result.data.finalizedDraftOutput.finalizedFields.edgeCases.push("leak")
    expect(input.data.draftCompletionTemplate.completionFields.edgeCases).toEqual(["keep"])
  })

  it("finalizedReady is false when completionReady is false", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionReady: false,
        completionFields: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
          completionNotes: null,
          isFinalized: true,
        },
      }),
    )
    expect(result.data.finalizedDraftOutput.finalizedReady).toBe(false)
  })

  it("finalizedReady is false when isFinalized is false", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionReady: true,
        completionFields: {
          title: "x",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
          completionNotes: null,
          isFinalized: false,
        },
      }),
    )
    expect(result.data.finalizedDraftOutput.finalizedReady).toBe(false)
  })

  it("finalizedReady is true only when completionReady and isFinalized are true", () => {
    const ready = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionReady: true,
        completionFields: {
          title: "x",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
          completionNotes: null,
          isFinalized: true,
        },
      }),
    )
    expect(ready.data.finalizedDraftOutput.finalizedReady).toBe(true)
  })

  it("computes hasFinalizedTarget from queueItemCode", () => {
    const withQueue = buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput())
    expect(withQueue.data.finalizedDraftOutput.summary.hasFinalizedTarget).toBe(true)

    const noQueue = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        queueItemCode: null,
        completionTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQueue.data.finalizedDraftOutput.summary.hasFinalizedTarget).toBe(false)
  })

  it("computes finalizedBlocked as negation of finalizedReady", () => {
    const blocked = buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput())
    expect(blocked.data.finalizedDraftOutput.summary.finalizedBlocked).toBe(true)

    const open = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionFields: {
          title: "x",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
          completionNotes: null,
          isFinalized: true,
        },
      }),
    )
    expect(open.data.finalizedDraftOutput.summary.finalizedBlocked).toBe(false)
  })

  it("finalizedIsEmpty is true when all finalized field slots are empty", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput())
    expect(result.data.finalizedDraftOutput.summary.finalizedIsEmpty).toBe(true)
    expect(result.summary.finalizedIsEmpty).toBe(true)
  })

  it("finalizedIsEmpty is false when any finalized field is non-empty", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionFields: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["one"],
          completionNotes: null,
          isFinalized: false,
        },
      }),
    )
    expect(result.data.finalizedDraftOutput.summary.finalizedIsEmpty).toBe(false)
  })

  it("finalizedMarkedComplete mirrors completionFields.isFinalized", () => {
    expect(
      buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput()).data.finalizedDraftOutput.summary
        .finalizedMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringFinalizedDraftOutput(
        buildInput({
          completionFields: {
            title: "x",
            objective: null,
            trigger: null,
            expectedBehavior: null,
            edgeCases: [],
            completionNotes: null,
            isFinalized: true,
          },
        }),
      ).data.finalizedDraftOutput.summary.finalizedMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when finalizedReady is false", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_FINALIZED_DRAFT_OUTPUT_BLOCKED",
      message: "Scenario draft finalized output is not ready for downstream handoff.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        queueItemCode: null,
        completionTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_FINALIZED_DRAFT_OUTPUT_TARGET",
      message: "No finalized draft output target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when finalized fields are empty", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_FINALIZED_DRAFT_OUTPUT_EMPTY",
      message:
        "Finalized draft output is empty and does not yet contain human-authored draft content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when finalized fields have content", () => {
    const result = buildScenarioDraftAuthoringFinalizedDraftOutput(
      buildInput({
        completionFields: {
          title: "only",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
          completionNotes: null,
          isFinalized: false,
        },
      }),
    )
    expect(
      result.warnings.some((w) => w.code === "AUTHORING_FINALIZED_DRAFT_OUTPUT_EMPTY"),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      completionFields: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["a"],
        completionNotes: null,
        isFinalized: false,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringFinalizedDraftOutput(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringFinalizedDraftOutput(input)).toEqual(
      buildScenarioDraftAuthoringFinalizedDraftOutput(input),
    )
  })
})
