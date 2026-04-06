import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult } from "../scenario-draft-authoring-scenario-definition-shape-output/types"
import { buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract } from "./build-scenario-draft-authoring-scenario-definition-assembly-contract"

const defaultShapeOutput: ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult["data"]["scenarioDefinitionShapeOutput"] =
  {
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
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult["data"]["scenarioDefinitionShapeOutput"]
  >,
): ScenarioDraftAuthoringScenarioDefinitionShapeOutputResult {
  const scenarioDefinitionShapeOutput = {
    ...defaultShapeOutput,
    ...overrides,
    shapeOutputTarget: {
      sessionCode: overrides?.sessionCode ?? defaultShapeOutput.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultShapeOutput.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultShapeOutput.queueItemCode,
      ...overrides?.shapeOutputTarget,
    },
    shapeOutputPayload: {
      ...defaultShapeOutput.shapeOutputPayload,
      ...overrides?.shapeOutputPayload,
      edgeCases: overrides?.shapeOutputPayload?.edgeCases ?? [
        ...defaultShapeOutput.shapeOutputPayload.edgeCases,
      ],
    },
    summary: {
      ...defaultShapeOutput.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { scenarioDefinitionShapeOutput },
    summary: {
      shapeOutputReady: scenarioDefinitionShapeOutput.shapeOutputReady,
      sessionCode: scenarioDefinitionShapeOutput.sessionCode,
      queueItemCode: scenarioDefinitionShapeOutput.queueItemCode,
      shapeOutputIsEmpty: scenarioDefinitionShapeOutput.summary.shapeOutputIsEmpty,
      shapeOutputMarkedComplete:
        scenarioDefinitionShapeOutput.summary.shapeOutputMarkedComplete,
      remainingSessionCount: scenarioDefinitionShapeOutput.remainingSessionCount,
      totalPlannedItems: scenarioDefinitionShapeOutput.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract", () => {
  it("matches the expected result shape", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput())

    expect(result).toEqual({
      data: {
        scenarioDefinitionAssemblyContract: {
          assemblyReady: false,
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: "queue-item-001",
          remainingSessionCount: 1,
          totalPlannedItems: 10,
          assemblyTarget: {
            sessionCode: "session-001",
            worksetCode: "workset-001",
            queueItemCode: "queue-item-001",
          },
          assemblyPayload: {
            title: null,
            objective: null,
            trigger: null,
            expectedBehavior: null,
            edgeCases: [],
            completionNotes: null,
          },
          summary: {
            hasAssemblyTarget: true,
            assemblyBlocked: true,
            assemblyIsEmpty: true,
            assemblyMarkedComplete: false,
          },
        },
      },
      summary: {
        assemblyReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        assemblyIsEmpty: true,
        assemblyMarkedComplete: false,
        remainingSessionCount: 1,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_BLOCKED",
          message: "Scenario-definition assembly contract is not ready for downstream assembly.",
          severity: "warning",
        },
        {
          code: "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_EMPTY",
          message:
            "Scenario-definition assembly contract is empty and does not yet contain assembly content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        sessionCode: "s-1",
        worksetCode: "w-2",
        queueItemCode: "q-3",
      }),
    )
    const c = result.data.scenarioDefinitionAssemblyContract
    expect(c.sessionCode).toBe("s-1")
    expect(c.worksetCode).toBe("w-2")
    expect(c.queueItemCode).toBe("q-3")
  })

  it("copies assemblyTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        sessionCode: "a",
        worksetCode: "b",
        queueItemCode: "c",
      }),
    )
    expect(result.data.scenarioDefinitionAssemblyContract.assemblyTarget).toEqual({
      sessionCode: "a",
      worksetCode: "b",
      queueItemCode: "c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({ remainingSessionCount: 2, totalPlannedItems: 15 }),
    )
    expect(result.data.scenarioDefinitionAssemblyContract.remainingSessionCount).toBe(2)
    expect(result.data.scenarioDefinitionAssemblyContract.totalPlannedItems).toBe(15)
    expect(result.summary.remainingSessionCount).toBe(2)
    expect(result.summary.totalPlannedItems).toBe(15)
  })

  it("copies shape-output payload into assemblyPayload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        shapeOutputPayload: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["x"],
          completionNotes: "n",
        },
      }),
    )
    expect(result.data.scenarioDefinitionAssemblyContract.assemblyPayload).toEqual({
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
      shapeOutputPayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["orig"],
        completionNotes: null,
      },
    })
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(input)
    result.data.scenarioDefinitionAssemblyContract.assemblyPayload.edgeCases.push("leak")
    expect(input.data.scenarioDefinitionShapeOutput.shapeOutputPayload.edgeCases).toEqual([
      "orig",
    ])
  })

  it("assemblyReady mirrors shapeOutputReady", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
        buildInput({ shapeOutputReady: false }),
      ).data.scenarioDefinitionAssemblyContract.assemblyReady,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
        buildInput({
          shapeOutputReady: true,
          summary: {
            hasShapeOutputTarget: true,
            shapeOutputBlocked: false,
            shapeOutputIsEmpty: false,
            shapeOutputMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionAssemblyContract.assemblyReady,
    ).toBe(true)
  })

  it("computes hasAssemblyTarget from queueItemCode", () => {
    const withQ =
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput())
    expect(withQ.data.scenarioDefinitionAssemblyContract.summary.hasAssemblyTarget).toBe(true)

    const noQ = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        queueItemCode: null,
        shapeOutputTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQ.data.scenarioDefinitionAssemblyContract.summary.hasAssemblyTarget).toBe(false)
  })

  it("computes assemblyBlocked as negation of assemblyReady", () => {
    const blocked =
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput())
    expect(blocked.data.scenarioDefinitionAssemblyContract.summary.assemblyBlocked).toBe(true)

    const open = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        shapeOutputReady: true,
        summary: {
          hasShapeOutputTarget: true,
          shapeOutputBlocked: false,
          shapeOutputIsEmpty: false,
          shapeOutputMarkedComplete: true,
        },
      }),
    )
    expect(open.data.scenarioDefinitionAssemblyContract.summary.assemblyBlocked).toBe(false)
  })

  it("assemblyIsEmpty is true for fully empty payload", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput())
    expect(result.data.scenarioDefinitionAssemblyContract.summary.assemblyIsEmpty).toBe(true)
  })

  it("assemblyIsEmpty is false for non-empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        shapeOutputPayload: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["e"],
          completionNotes: null,
        },
      }),
    )
    expect(result.data.scenarioDefinitionAssemblyContract.summary.assemblyIsEmpty).toBe(false)
  })

  it("assemblyMarkedComplete mirrors shapeOutputMarkedComplete", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput()).data
        .scenarioDefinitionAssemblyContract.summary.assemblyMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
        buildInput({
          summary: {
            hasShapeOutputTarget: true,
            shapeOutputBlocked: false,
            shapeOutputIsEmpty: false,
            shapeOutputMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionAssemblyContract.summary.assemblyMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when assemblyReady is false", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_BLOCKED",
      message: "Scenario-definition assembly contract is not ready for downstream assembly.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        queueItemCode: null,
        shapeOutputTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_TARGET",
      message:
        "No scenario-definition assembly contract target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when assembly contract payload is empty", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_EMPTY",
      message:
        "Scenario-definition assembly contract is empty and does not yet contain assembly content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when payload has content", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(
      buildInput({
        shapeOutputPayload: {
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
      result.warnings.some(
        (w) => w.code === "AUTHORING_SCENARIO_DEFINITION_ASSEMBLY_CONTRACT_EMPTY",
      ),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      shapeOutputPayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["z"],
        completionNotes: null,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(input)).toEqual(
      buildScenarioDraftAuthoringScenarioDefinitionAssemblyContract(input),
    )
  })
})
