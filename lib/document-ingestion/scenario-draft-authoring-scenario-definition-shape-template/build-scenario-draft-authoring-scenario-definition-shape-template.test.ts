import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult } from "../scenario-draft-authoring-scenario-definition-structuring-contract/types"
import { buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate } from "./build-scenario-draft-authoring-scenario-definition-shape-template"

const defaultStructuringContract: ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult["data"]["scenarioDefinitionStructuringContract"] =
  {
    structuringReady: false,
    sessionCode: "session-001",
    worksetCode: "workset-001",
    queueItemCode: "queue-item-001",
    remainingSessionCount: 1,
    totalPlannedItems: 10,
    structuringTarget: {
      sessionCode: "session-001",
      worksetCode: "workset-001",
      queueItemCode: "queue-item-001",
    },
    structuringPayload: {
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
      completionNotes: null,
    },
    summary: {
      hasStructuringTarget: true,
      structuringBlocked: true,
      structuringIsEmpty: true,
      structuringMarkedComplete: false,
    },
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult["data"]["scenarioDefinitionStructuringContract"]
  >,
): ScenarioDraftAuthoringScenarioDefinitionStructuringContractResult {
  const scenarioDefinitionStructuringContract = {
    ...defaultStructuringContract,
    ...overrides,
    structuringTarget: {
      sessionCode: overrides?.sessionCode ?? defaultStructuringContract.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultStructuringContract.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultStructuringContract.queueItemCode,
      ...overrides?.structuringTarget,
    },
    structuringPayload: {
      ...defaultStructuringContract.structuringPayload,
      ...overrides?.structuringPayload,
      edgeCases: overrides?.structuringPayload?.edgeCases ?? [
        ...defaultStructuringContract.structuringPayload.edgeCases,
      ],
    },
    summary: {
      ...defaultStructuringContract.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { scenarioDefinitionStructuringContract },
    summary: {
      structuringReady: scenarioDefinitionStructuringContract.structuringReady,
      sessionCode: scenarioDefinitionStructuringContract.sessionCode,
      queueItemCode: scenarioDefinitionStructuringContract.queueItemCode,
      structuringIsEmpty: scenarioDefinitionStructuringContract.summary.structuringIsEmpty,
      structuringMarkedComplete:
        scenarioDefinitionStructuringContract.summary.structuringMarkedComplete,
      remainingSessionCount: scenarioDefinitionStructuringContract.remainingSessionCount,
      totalPlannedItems: scenarioDefinitionStructuringContract.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate", () => {
  it("matches the expected result shape", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput())

    expect(result).toEqual({
      data: {
        scenarioDefinitionShapeTemplate: {
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
        },
      },
      summary: {
        shapeReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        shapeIsEmpty: true,
        shapeMarkedComplete: false,
        remainingSessionCount: 1,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_BLOCKED",
          message: "Scenario-definition shape template is not ready for downstream shaping.",
          severity: "warning",
        },
        {
          code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_EMPTY",
          message:
            "Scenario-definition shape template is empty and does not yet contain shape content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        sessionCode: "s-1",
        worksetCode: "w-2",
        queueItemCode: "q-3",
      }),
    )
    const t = result.data.scenarioDefinitionShapeTemplate
    expect(t.sessionCode).toBe("s-1")
    expect(t.worksetCode).toBe("w-2")
    expect(t.queueItemCode).toBe("q-3")
  })

  it("copies shapeTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        sessionCode: "a",
        worksetCode: "b",
        queueItemCode: "c",
      }),
    )
    expect(result.data.scenarioDefinitionShapeTemplate.shapeTarget).toEqual({
      sessionCode: "a",
      worksetCode: "b",
      queueItemCode: "c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({ remainingSessionCount: 8, totalPlannedItems: 50 }),
    )
    expect(result.data.scenarioDefinitionShapeTemplate.remainingSessionCount).toBe(8)
    expect(result.data.scenarioDefinitionShapeTemplate.totalPlannedItems).toBe(50)
    expect(result.summary.remainingSessionCount).toBe(8)
    expect(result.summary.totalPlannedItems).toBe(50)
  })

  it("copies structuring payload into shapePayload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        structuringPayload: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["x"],
          completionNotes: "n",
        },
      }),
    )
    expect(result.data.scenarioDefinitionShapeTemplate.shapePayload).toEqual({
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
      structuringPayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["orig"],
        completionNotes: null,
      },
    })
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(input)
    result.data.scenarioDefinitionShapeTemplate.shapePayload.edgeCases.push("leak")
    expect(input.data.scenarioDefinitionStructuringContract.structuringPayload.edgeCases).toEqual([
      "orig",
    ])
  })

  it("shapeReady mirrors structuringReady", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
        buildInput({ structuringReady: false }),
      ).data.scenarioDefinitionShapeTemplate.shapeReady,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
        buildInput({
          structuringReady: true,
          summary: {
            hasStructuringTarget: true,
            structuringBlocked: false,
            structuringIsEmpty: false,
            structuringMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionShapeTemplate.shapeReady,
    ).toBe(true)
  })

  it("computes hasShapeTarget from queueItemCode", () => {
    const withQ = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput())
    expect(withQ.data.scenarioDefinitionShapeTemplate.summary.hasShapeTarget).toBe(true)

    const noQ = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        queueItemCode: null,
        structuringTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQ.data.scenarioDefinitionShapeTemplate.summary.hasShapeTarget).toBe(false)
  })

  it("computes shapeBlocked as negation of shapeReady", () => {
    const blocked = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput())
    expect(blocked.data.scenarioDefinitionShapeTemplate.summary.shapeBlocked).toBe(true)

    const open = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        structuringReady: true,
        summary: {
          hasStructuringTarget: true,
          structuringBlocked: false,
          structuringIsEmpty: false,
          structuringMarkedComplete: true,
        },
      }),
    )
    expect(open.data.scenarioDefinitionShapeTemplate.summary.shapeBlocked).toBe(false)
  })

  it("shapeIsEmpty is true for fully empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput())
    expect(result.data.scenarioDefinitionShapeTemplate.summary.shapeIsEmpty).toBe(true)
  })

  it("shapeIsEmpty is false for non-empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        structuringPayload: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["e"],
          completionNotes: null,
        },
      }),
    )
    expect(result.data.scenarioDefinitionShapeTemplate.summary.shapeIsEmpty).toBe(false)
  })

  it("shapeMarkedComplete mirrors structuringMarkedComplete", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput()).data
        .scenarioDefinitionShapeTemplate.summary.shapeMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
        buildInput({
          summary: {
            hasStructuringTarget: true,
            structuringBlocked: false,
            structuringIsEmpty: false,
            structuringMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionShapeTemplate.summary.shapeMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when shapeReady is false", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_BLOCKED",
      message: "Scenario-definition shape template is not ready for downstream shaping.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        queueItemCode: null,
        structuringTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_TARGET",
      message:
        "No scenario-definition shape template target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when shape payload is empty", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_EMPTY",
      message:
        "Scenario-definition shape template is empty and does not yet contain shape content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when payload has content", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(
      buildInput({
        structuringPayload: {
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
      result.warnings.some((w) => w.code === "AUTHORING_SCENARIO_DEFINITION_SHAPE_TEMPLATE_EMPTY"),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      structuringPayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["z"],
        completionNotes: null,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(input)).toEqual(
      buildScenarioDraftAuthoringScenarioDefinitionShapeTemplate(input),
    )
  })
})
