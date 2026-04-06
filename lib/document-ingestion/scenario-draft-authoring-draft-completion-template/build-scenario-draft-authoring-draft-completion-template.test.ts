import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringDraftInputTemplateResult } from "../scenario-draft-authoring-draft-input-template/types"
import { buildScenarioDraftAuthoringDraftCompletionTemplate } from "./build-scenario-draft-authoring-draft-completion-template"

const defaultTemplate: ScenarioDraftAuthoringDraftInputTemplateResult["data"]["draftInputTemplate"] =
  {
    templateReady: true,
    sessionCode: "session-001",
    worksetCode: "workset-001",
    queueItemCode: "queue-item-001",
    remainingSessionCount: 3,
    totalPlannedItems: 10,
    templateTarget: {
      sessionCode: "session-001",
      worksetCode: "workset-001",
      queueItemCode: "queue-item-001",
    },
    templateFields: {
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
    },
    summary: {
      hasTemplateTarget: true,
      templateBlocked: false,
      templateIsEmpty: true,
    },
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringDraftInputTemplateResult["data"]["draftInputTemplate"]
  >,
): ScenarioDraftAuthoringDraftInputTemplateResult {
  const draftInputTemplate = {
    ...defaultTemplate,
    ...overrides,
    templateFields: {
      ...defaultTemplate.templateFields,
      ...overrides?.templateFields,
      edgeCases: overrides?.templateFields?.edgeCases ?? [
        ...defaultTemplate.templateFields.edgeCases,
      ],
    },
    summary: {
      ...defaultTemplate.summary,
      ...overrides?.summary,
    },
    templateTarget:
      overrides?.templateTarget ?? {
        sessionCode: overrides?.sessionCode ?? defaultTemplate.sessionCode,
        worksetCode: overrides?.worksetCode ?? defaultTemplate.worksetCode,
        queueItemCode: overrides?.queueItemCode ?? defaultTemplate.queueItemCode,
      },
  }

  return {
    data: { draftInputTemplate },
    summary: {
      templateReady: draftInputTemplate.templateReady,
      sessionCode: draftInputTemplate.sessionCode,
      queueItemCode: draftInputTemplate.queueItemCode,
      templateIsEmpty: draftInputTemplate.summary.templateIsEmpty,
      remainingSessionCount: draftInputTemplate.remainingSessionCount,
      totalPlannedItems: draftInputTemplate.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringDraftCompletionTemplate", () => {
  it("matches the expected result shape for empty input template", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput())

    expect(result).toEqual({
      data: {
        draftCompletionTemplate: {
          completionReady: true,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 3,
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
        },
      },
      summary: {
        completionReady: true,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        completionIsEmpty: true,
        completionIsFinalized: false,
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_DRAFT_COMPLETION_TEMPLATE_EMPTY",
          message: "Completion template is empty and awaits human finalization.",
          severity: "info",
        },
      ],
    })
  })

  it("maps completion target from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({
        sessionCode: "s-a",
        worksetCode: "w-b",
        queueItemCode: "q-c",
      }),
    )

    expect(result.data.draftCompletionTemplate.sessionCode).toBe("s-a")
    expect(result.data.draftCompletionTemplate.worksetCode).toBe("w-b")
    expect(result.data.draftCompletionTemplate.queueItemCode).toBe("q-c")
    expect(result.data.draftCompletionTemplate.completionTarget).toEqual({
      sessionCode: "s-a",
      worksetCode: "w-b",
      queueItemCode: "q-c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({ remainingSessionCount: 9, totalPlannedItems: 42 }),
    )

    expect(result.data.draftCompletionTemplate.remainingSessionCount).toBe(9)
    expect(result.data.draftCompletionTemplate.totalPlannedItems).toBe(42)
    expect(result.summary.remainingSessionCount).toBe(9)
    expect(result.summary.totalPlannedItems).toBe(42)
  })

  it("copies templateFields into completionFields with completion slots defaulted", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({
        templateFields: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["a", "b"],
        },
        summary: {
          hasTemplateTarget: true,
          templateBlocked: false,
          templateIsEmpty: false,
        },
      }),
    )

    expect(result.data.draftCompletionTemplate.completionFields).toEqual({
      title: "T",
      objective: "O",
      trigger: "Tr",
      expectedBehavior: "E",
      edgeCases: ["a", "b"],
      completionNotes: null,
      isFinalized: false,
    })
  })

  it("defaults completionNotes to null and isFinalized to false", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput())

    expect(result.data.draftCompletionTemplate.completionFields.completionNotes).toBe(null)
    expect(result.data.draftCompletionTemplate.completionFields.isFinalized).toBe(false)
    expect(result.summary.completionIsFinalized).toBe(false)
  })

  it("maps completionReady from templateReady", () => {
    expect(
      buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput({ templateReady: true })).data
        .draftCompletionTemplate.completionReady,
    ).toBe(true)
    expect(
      buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput({ templateReady: false })).data
        .draftCompletionTemplate.completionReady,
    ).toBe(false)
  })

  it("computes completionBlocked from templateReady", () => {
    const open = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({ templateReady: true }),
    )
    const blocked = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({ templateReady: false }),
    )

    expect(open.data.draftCompletionTemplate.summary.completionBlocked).toBe(false)
    expect(blocked.data.draftCompletionTemplate.summary.completionBlocked).toBe(true)
  })

  it("computes completionIsEmpty when all fields including notes are empty", () => {
    const empty = buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput())
    expect(empty.data.draftCompletionTemplate.summary.completionIsEmpty).toBe(true)

    const filled = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({
        templateFields: {
          title: "x",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
        },
        summary: {
          hasTemplateTarget: true,
          templateBlocked: false,
          templateIsEmpty: false,
        },
      }),
    )
    expect(filled.data.draftCompletionTemplate.summary.completionIsEmpty).toBe(false)
  })

  it("completionIsFinalized is false when builder sets isFinalized false", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput())
    expect(result.data.draftCompletionTemplate.summary.completionIsFinalized).toBe(false)
  })

  it("emits blocked warning when completionReady is false", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({ templateReady: false }),
    )
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_DRAFT_COMPLETION_TEMPLATE_BLOCKED",
      message: "Scenario draft completion template is not ready for finalization.",
      severity: "warning",
    })
  })

  it("emits no-target info when queueItemCode is null", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({
        queueItemCode: null,
        templateTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_DRAFT_COMPLETION_TEMPLATE_TARGET",
      message: "No completion template target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when completion is empty", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_DRAFT_COMPLETION_TEMPLATE_EMPTY",
      message: "Completion template is empty and awaits human finalization.",
      severity: "info",
    })
  })

  it("does not emit empty completion warning when template has content", () => {
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(
      buildInput({
        templateFields: {
          title: "Only title",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
        },
        summary: {
          hasTemplateTarget: true,
          templateBlocked: false,
          templateIsEmpty: false,
        },
      }),
    )
    expect(
      result.warnings.some((w) => w.code === "AUTHORING_DRAFT_COMPLETION_TEMPLATE_EMPTY"),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      templateFields: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["x"],
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringDraftCompletionTemplate(input)
    expect(input).toEqual(before)
  })

  it("clones edgeCases so output array is not input reference", () => {
    const input = buildInput({
      templateFields: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["one"],
      },
    })
    const result = buildScenarioDraftAuthoringDraftCompletionTemplate(input)
    result.data.draftCompletionTemplate.completionFields.edgeCases.push("mutated")
    expect(input.data.draftInputTemplate.templateFields.edgeCases).toEqual(["one"])
  })

  it("is deterministic", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringDraftCompletionTemplate(input)).toEqual(
      buildScenarioDraftAuthoringDraftCompletionTemplate(input),
    )
  })
})
