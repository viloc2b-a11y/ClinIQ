import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult } from "../scenario-draft-authoring-scenario-definition-shape-template/types"
import { buildScenarioDraftAuthoringScenarioDefinitionShapeOutput } from "./build-scenario-draft-authoring-scenario-definition-shape-output"

const defaultShapeTemplate: ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult["data"]["scenarioDefinitionShapeTemplate"] =
  {
    shapeReady: false,
    sessionCode: "session-001",
    worksetCode: "workset-001",
    queueItemCode: "queue-item-001",
    remainingSessionCount: 1,
    totalPlannedItems: 10,
    shapeTarget: {
      sessionCode: "session-001",
      worksetCode: "workset-001",
      queueItemCode: "queue-item-001",
    },
    shapePayload: {
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
      completionNotes: null,
    },
    summary: {
      hasShapeTarget: true,
      shapeBlocked: true,
      shapeIsEmpty: true,
      shapeMarkedComplete: false,
    },
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult["data"]["scenarioDefinitionShapeTemplate"]
  >,
): ScenarioDraftAuthoringScenarioDefinitionShapeTemplateResult {
  const scenarioDefinitionShapeTemplate = {
    ...defaultShapeTemplate,
    ...overrides,
    shapeTarget: {
      sessionCode: overrides?.sessionCode ?? defaultShapeTemplate.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultShapeTemplate.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultShapeTemplate.queueItemCode,
      ...overrides?.shapeTarget,
    },
    shapePayload: {
      ...defaultShapeTemplate.shapePayload,
      ...overrides?.shapePayload,
      edgeCases: overrides?.shapePayload?.edgeCases ?? [
        ...defaultShapeTemplate.shapePayload.edgeCases,
      ],
    },
    summary: {
      ...defaultShapeTemplate.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { scenarioDefinitionShapeTemplate },
    summary: {
      shapeReady: scenarioDefinitionShapeTemplate.shapeReady,
      sessionCode: scenarioDefinitionShapeTemplate.sessionCode,
      queueItemCode: scenarioDefinitionShapeTemplate.queueItemCode,
      shapeIsEmpty: scenarioDefinitionShapeTemplate.summary.shapeIsEmpty,
      shapeMarkedComplete: scenarioDefinitionShapeTemplate.summary.shapeMarkedComplete,
      remainingSessionCount: scenarioDefinitionShapeTemplate.remainingSessionCount,
      totalPlannedItems: scenarioDefinitionShapeTemplate.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringScenarioDefinitionShapeOutput", () => {
  it("matches the expected result shape", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput())

    expect(result).toEqual({
      data: {
        scenarioDefinitionShapeOutput: {
          shapeOutputReady: false,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 1,
          totalPlannedItems: 10,
          shapeOutputTarget: {
            sessionCode: "session-001",
            worksetCode: "workset-001",
            queueItemCode: "queue-item-001",
          },
          shapeOutputPayload: {
            title: null,
            objective: null,
            trigger: null,
            expectedBehavior: null,
            edgeCases: [],
            completionNotes: null,
          },
          summary: {
            hasShapeOutputTarget: true,
            shapeOutputBlocked: true,
            shapeOutputIsEmpty: true,
            shapeOutputMarkedComplete: false,
          },
        },
      },
      summary: {
        shapeOutputReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        shapeOutputIsEmpty: true,
        shapeOutputMarkedComplete: false,
        remainingSessionCount: 1,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_BLOCKED",
          message: "Scenario-definition shape output is not ready for downstream conversion.",
          severity: "warning",
        },
        {
          code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_EMPTY",
          message:
            "Scenario-definition shape output is empty and does not yet contain shape output content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        sessionCode: "s-1",
        worksetCode: "w-2",
        queueItemCode: "q-3",
      }),
    )
    const o = result.data.scenarioDefinitionShapeOutput
    expect(o.sessionCode).toBe("s-1")
    expect(o.worksetCode).toBe("w-2")
    expect(o.queueItemCode).toBe("q-3")
  })

  it("copies shapeOutputTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        sessionCode: "a",
        worksetCode: "b",
        queueItemCode: "c",
      }),
    )
    expect(result.data.scenarioDefinitionShapeOutput.shapeOutputTarget).toEqual({
      sessionCode: "a",
      worksetCode: "b",
      queueItemCode: "c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({ remainingSessionCount: 3, totalPlannedItems: 25 }),
    )
    expect(result.data.scenarioDefinitionShapeOutput.remainingSessionCount).toBe(3)
    expect(result.data.scenarioDefinitionShapeOutput.totalPlannedItems).toBe(25)
    expect(result.summary.remainingSessionCount).toBe(3)
    expect(result.summary.totalPlannedItems).toBe(25)
  })

  it("copies shape payload into shapeOutputPayload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        shapePayload: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["x"],
          completionNotes: "n",
        },
      }),
    )
    expect(result.data.scenarioDefinitionShapeOutput.shapeOutputPayload).toEqual({
      title: "T",
      objective: "O",
      trigger: "Tr",
      expectedBehavior: "E",
      edgeCases: ["x"],
      completionNotes: "n",
    })
  })

  it("clones edgeCases so mutating output does not affect input", () => {
    const input = buildInput({
      shapePayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["orig"],
        completionNotes: null,
      },
    })
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(input)
    result.data.scenarioDefinitionShapeOutput.shapeOutputPayload.edgeCases.push("leak")
    expect(input.data.scenarioDefinitionShapeTemplate.shapePayload.edgeCases).toEqual(["orig"])
  })

  it("shapeOutputReady mirrors shapeReady", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
        buildInput({ shapeReady: false }),
      ).data.scenarioDefinitionShapeOutput.shapeOutputReady,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
        buildInput({
          shapeReady: true,
          summary: {
            hasShapeTarget: true,
            shapeBlocked: false,
            shapeIsEmpty: false,
            shapeMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionShapeOutput.shapeOutputReady,
    ).toBe(true)
  })

  it("computes hasShapeOutputTarget from queueItemCode", () => {
    const withQ = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput())
    expect(withQ.data.scenarioDefinitionShapeOutput.summary.hasShapeOutputTarget).toBe(true)

    const noQ = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        queueItemCode: null,
        shapeTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQ.data.scenarioDefinitionShapeOutput.summary.hasShapeOutputTarget).toBe(false)
  })

  it("computes shapeOutputBlocked as negation of shapeOutputReady", () => {
    const blocked = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput())
    expect(blocked.data.scenarioDefinitionShapeOutput.summary.shapeOutputBlocked).toBe(true)

    const open = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        shapeReady: true,
        summary: {
          hasShapeTarget: true,
          shapeBlocked: false,
          shapeIsEmpty: false,
          shapeMarkedComplete: true,
        },
      }),
    )
    expect(open.data.scenarioDefinitionShapeOutput.summary.shapeOutputBlocked).toBe(false)
  })

  it("shapeOutputIsEmpty is true for fully empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput())
    expect(result.data.scenarioDefinitionShapeOutput.summary.shapeOutputIsEmpty).toBe(true)
  })

  it("shapeOutputIsEmpty is false for non-empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        shapePayload: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["e"],
          completionNotes: null,
        },
      }),
    )
    expect(result.data.scenarioDefinitionShapeOutput.summary.shapeOutputIsEmpty).toBe(false)
  })

  it("shapeOutputMarkedComplete mirrors shapeMarkedComplete", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput()).data
        .scenarioDefinitionShapeOutput.summary.shapeOutputMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
        buildInput({
          summary: {
            hasShapeTarget: true,
            shapeBlocked: false,
            shapeIsEmpty: false,
            shapeMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionShapeOutput.summary.shapeOutputMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when shapeOutputReady is false", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_BLOCKED",
      message: "Scenario-definition shape output is not ready for downstream conversion.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        queueItemCode: null,
        shapeTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_TARGET",
      message:
        "No scenario-definition shape output target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when shape output payload is empty", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_EMPTY",
      message:
        "Scenario-definition shape output is empty and does not yet contain shape output content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when payload has content", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(
      buildInput({
        shapePayload: {
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
      result.warnings.some((w) => w.code === "AUTHORING_SCENARIO_DEFINITION_SHAPE_OUTPUT_EMPTY"),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      shapePayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["z"],
        completionNotes: null,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(input)).toEqual(
      buildScenarioDraftAuthoringScenarioDefinitionShapeOutput(input),
    )
  })
})
