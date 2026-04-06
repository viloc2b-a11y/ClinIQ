import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringDraftScaffoldContractResult } from "../scenario-draft-authoring-draft-scaffold-contract/types"
import { buildScenarioDraftAuthoringDraftInputTemplate } from "./build-scenario-draft-authoring-draft-input-template"

const defaultContract: ScenarioDraftAuthoringDraftScaffoldContractResult["data"]["draftScaffoldContract"] =
  {
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
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringDraftScaffoldContractResult["data"]["draftScaffoldContract"]
  >,
): ScenarioDraftAuthoringDraftScaffoldContractResult {
  const contract = {
    ...defaultContract,
    ...overrides,
    scaffold: {
      ...defaultContract.scaffold,
      ...overrides?.scaffold,
    },
    summary: {
      ...defaultContract.summary,
      ...overrides?.summary,
    },
    scaffoldTarget:
      overrides?.scaffoldTarget ?? {
        sessionCode: overrides?.sessionCode ?? defaultContract.sessionCode,
        worksetCode: overrides?.worksetCode ?? defaultContract.worksetCode,
        queueItemCode: overrides?.queueItemCode ?? defaultContract.queueItemCode,
      },
  }

  return {
    data: { draftScaffoldContract: contract },
    summary: {
      scaffoldReady: contract.scaffoldReady,
      sessionCode: contract.sessionCode,
      queueItemCode: contract.queueItemCode,
      scaffoldIsEmpty: contract.summary.scaffoldIsEmpty,
      remainingSessionCount: contract.remainingSessionCount,
      totalPlannedItems: contract.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringDraftInputTemplate", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(buildInput())

    expect(result).toEqual({
      data: {
        draftInputTemplate: {
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
        },
      },
      summary: {
        templateReady: true,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        templateIsEmpty: true,
        remainingSessionCount: 3,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_DRAFT_INPUT_TEMPLATE_EMPTY",
          message: "Draft input template is intentionally empty and awaits human authoring input.",
          severity: "info",
        },
      ],
    })
  })

  it("copies target fields correctly", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        sessionCode: "session-xyz",
        worksetCode: "workset-xyz",
        queueItemCode: "queue-item-xyz",
      }),
    )

    expect(result.data.draftInputTemplate.sessionCode).toBe("session-xyz")
    expect(result.data.draftInputTemplate.worksetCode).toBe("workset-xyz")
    expect(result.data.draftInputTemplate.queueItemCode).toBe("queue-item-xyz")
    expect(result.data.draftInputTemplate.templateTarget).toEqual({
      sessionCode: "session-xyz",
      worksetCode: "workset-xyz",
      queueItemCode: "queue-item-xyz",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems correctly", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        remainingSessionCount: 7,
        totalPlannedItems: 21,
      }),
    )

    expect(result.data.draftInputTemplate.remainingSessionCount).toBe(7)
    expect(result.data.draftInputTemplate.totalPlannedItems).toBe(21)
    expect(result.summary.remainingSessionCount).toBe(7)
    expect(result.summary.totalPlannedItems).toBe(21)
  })

  it("copies scaffold fields into templateFields", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        scaffold: {
          title: "Title A",
          objective: "Objective A",
          trigger: "Trigger A",
          expectedBehavior: "Behavior A",
          edgeCases: ["edge-1", "edge-2"],
        },
        summary: {
          hasScaffoldTarget: true,
          scaffoldBlocked: false,
          scaffoldIsEmpty: false,
        },
      }),
    )

    expect(result.data.draftInputTemplate.templateFields).toEqual({
      title: "Title A",
      objective: "Objective A",
      trigger: "Trigger A",
      expectedBehavior: "Behavior A",
      edgeCases: ["edge-1", "edge-2"],
    })
  })

  it("computes hasTemplateTarget correctly when queueItemCode exists", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({ queueItemCode: "queue-item-123" }),
    )

    expect(result.data.draftInputTemplate.summary.hasTemplateTarget).toBe(true)
  })

  it("computes hasTemplateTarget correctly when queueItemCode is null", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        queueItemCode: null,
        scaffoldTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )

    expect(result.data.draftInputTemplate.summary.hasTemplateTarget).toBe(false)
  })

  it("sets templateReady true when scaffoldReady is true", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({ scaffoldReady: true }),
    )

    expect(result.data.draftInputTemplate.templateReady).toBe(true)
  })

  it("sets templateReady false when scaffoldReady is false", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({ scaffoldReady: false }),
    )

    expect(result.data.draftInputTemplate.templateReady).toBe(false)
  })

  it("computes templateBlocked correctly", () => {
    const activeResult = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({ scaffoldReady: true }),
    )
    const blockedResult = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({ scaffoldReady: false }),
    )

    expect(activeResult.data.draftInputTemplate.summary.templateBlocked).toBe(false)
    expect(blockedResult.data.draftInputTemplate.summary.templateBlocked).toBe(true)
  })

  it("computes templateIsEmpty true for empty scaffold", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(buildInput())

    expect(result.data.draftInputTemplate.summary.templateIsEmpty).toBe(true)
    expect(result.summary.templateIsEmpty).toBe(true)
  })

  it("computes templateIsEmpty false for non-empty scaffold", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        scaffold: {
          title: "Filled title",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
        },
        summary: {
          hasScaffoldTarget: true,
          scaffoldBlocked: false,
          scaffoldIsEmpty: false,
        },
      }),
    )

    expect(result.data.draftInputTemplate.summary.templateIsEmpty).toBe(false)
  })

  it("does not emit empty-template info when template is not empty", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        scaffold: {
          title: "Filled title",
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: [],
        },
        summary: {
          hasScaffoldTarget: true,
          scaffoldBlocked: false,
          scaffoldIsEmpty: false,
        },
      }),
    )

    expect(result.warnings.some((w) => w.code === "AUTHORING_DRAFT_INPUT_TEMPLATE_EMPTY")).toBe(
      false,
    )
  })

  it("emits a warning when templateReady is false", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({ scaffoldReady: false }),
    )

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_DRAFT_INPUT_TEMPLATE_BLOCKED",
      message: "Scenario draft authoring draft input template is not ready for downstream drafting input use.",
      severity: "warning",
    })
  })

  it("emits an info warning when no queue item target exists", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(
      buildInput({
        queueItemCode: null,
        scaffoldTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )

    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_DRAFT_INPUT_TEMPLATE_TARGET",
      message: "No authoring draft input template target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits an info warning for intentionally empty template", () => {
    const result = buildScenarioDraftAuthoringDraftInputTemplate(buildInput())

    expect(result.warnings).toContainEqual({
      code: "AUTHORING_DRAFT_INPUT_TEMPLATE_EMPTY",
      message: "Draft input template is intentionally empty and awaits human authoring input.",
      severity: "info",
    })
  })

  it("does not mutate input", () => {
    const input = buildInput()
    const before = JSON.parse(JSON.stringify(input)) as typeof input

    buildScenarioDraftAuthoringDraftInputTemplate(input)

    expect(input).toEqual(before)
  })

  it("is deterministic with identical input", () => {
    const input = buildInput()

    const resultA = buildScenarioDraftAuthoringDraftInputTemplate(input)
    const resultB = buildScenarioDraftAuthoringDraftInputTemplate(input)

    expect(resultA).toEqual(resultB)
  })
})
