import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult } from "../scenario-draft-authoring-scenario-definition-draft-package/types"
import { buildScenarioDraftAuthoringScenarioDefinitionStructuringContract } from "./build-scenario-draft-authoring-scenario-definition-structuring-contract"

const defaultDraftPackage: ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult["data"]["scenarioDefinitionDraftPackage"] =
  {
    packageReady: false,
    sessionCode: "session-001",
    worksetCode: "workset-001",
    queueItemCode: "queue-item-001",
    remainingSessionCount: 1,
    totalPlannedItems: 10,
    packageTarget: {
      sessionCode: "session-001",
      worksetCode: "workset-001",
      queueItemCode: "queue-item-001",
    },
    draftPackagePayload: {
      title: null,
      objective: null,
      trigger: null,
      expectedBehavior: null,
      edgeCases: [],
      completionNotes: null,
    },
    summary: {
      hasPackageTarget: true,
      packageBlocked: true,
      packageIsEmpty: true,
      packageMarkedComplete: false,
    },
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult["data"]["scenarioDefinitionDraftPackage"]
  >,
): ScenarioDraftAuthoringScenarioDefinitionDraftPackageResult {
  const scenarioDefinitionDraftPackage = {
    ...defaultDraftPackage,
    ...overrides,
    packageTarget: {
      sessionCode: overrides?.sessionCode ?? defaultDraftPackage.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultDraftPackage.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultDraftPackage.queueItemCode,
      ...overrides?.packageTarget,
    },
    draftPackagePayload: {
      ...defaultDraftPackage.draftPackagePayload,
      ...overrides?.draftPackagePayload,
      edgeCases: overrides?.draftPackagePayload?.edgeCases ?? [
        ...defaultDraftPackage.draftPackagePayload.edgeCases,
      ],
    },
    summary: {
      ...defaultDraftPackage.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { scenarioDefinitionDraftPackage },
    summary: {
      packageReady: scenarioDefinitionDraftPackage.packageReady,
      sessionCode: scenarioDefinitionDraftPackage.sessionCode,
      queueItemCode: scenarioDefinitionDraftPackage.queueItemCode,
      packageIsEmpty: scenarioDefinitionDraftPackage.summary.packageIsEmpty,
      packageMarkedComplete: scenarioDefinitionDraftPackage.summary.packageMarkedComplete,
      remainingSessionCount: scenarioDefinitionDraftPackage.remainingSessionCount,
      totalPlannedItems: scenarioDefinitionDraftPackage.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringScenarioDefinitionStructuringContract", () => {
  it("matches the expected result shape", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput())

    expect(result).toEqual({
      data: {
        scenarioDefinitionStructuringContract: {
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
        },
      },
      summary: {
        structuringReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        structuringIsEmpty: true,
        structuringMarkedComplete: false,
        remainingSessionCount: 1,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_BLOCKED",
          message: "Scenario-definition structuring contract is not ready for downstream shaping.",
          severity: "warning",
        },
        {
          code: "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_EMPTY",
          message:
            "Scenario-definition structuring contract is empty and does not yet contain structuring content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        sessionCode: "s-1",
        worksetCode: "w-2",
        queueItemCode: "q-3",
      }),
    )
    const c = result.data.scenarioDefinitionStructuringContract
    expect(c.sessionCode).toBe("s-1")
    expect(c.worksetCode).toBe("w-2")
    expect(c.queueItemCode).toBe("q-3")
  })

  it("copies structuringTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        sessionCode: "a",
        worksetCode: "b",
        queueItemCode: "c",
      }),
    )
    expect(result.data.scenarioDefinitionStructuringContract.structuringTarget).toEqual({
      sessionCode: "a",
      worksetCode: "b",
      queueItemCode: "c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({ remainingSessionCount: 6, totalPlannedItems: 40 }),
    )
    expect(result.data.scenarioDefinitionStructuringContract.remainingSessionCount).toBe(6)
    expect(result.data.scenarioDefinitionStructuringContract.totalPlannedItems).toBe(40)
    expect(result.summary.remainingSessionCount).toBe(6)
    expect(result.summary.totalPlannedItems).toBe(40)
  })

  it("copies draft package payload into structuringPayload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        draftPackagePayload: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["x"],
          completionNotes: "n",
        },
      }),
    )
    expect(result.data.scenarioDefinitionStructuringContract.structuringPayload).toEqual({
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
      draftPackagePayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["orig"],
        completionNotes: null,
      },
    })
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(input)
    result.data.scenarioDefinitionStructuringContract.structuringPayload.edgeCases.push("leak")
    expect(input.data.scenarioDefinitionDraftPackage.draftPackagePayload.edgeCases).toEqual([
      "orig",
    ])
  })

  it("structuringReady mirrors packageReady", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
        buildInput({ packageReady: false }),
      ).data.scenarioDefinitionStructuringContract.structuringReady,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
        buildInput({
          packageReady: true,
          summary: {
            hasPackageTarget: true,
            packageBlocked: false,
            packageIsEmpty: false,
            packageMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionStructuringContract.structuringReady,
    ).toBe(true)
  })

  it("computes hasStructuringTarget from queueItemCode", () => {
    const withQ =
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput())
    expect(withQ.data.scenarioDefinitionStructuringContract.summary.hasStructuringTarget).toBe(
      true,
    )

    const noQ = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        queueItemCode: null,
        packageTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQ.data.scenarioDefinitionStructuringContract.summary.hasStructuringTarget).toBe(
      false,
    )
  })

  it("computes structuringBlocked as negation of structuringReady", () => {
    const blocked =
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput())
    expect(blocked.data.scenarioDefinitionStructuringContract.summary.structuringBlocked).toBe(
      true,
    )

    const open = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        packageReady: true,
        summary: {
          hasPackageTarget: true,
          packageBlocked: false,
          packageIsEmpty: false,
          packageMarkedComplete: true,
        },
      }),
    )
    expect(open.data.scenarioDefinitionStructuringContract.summary.structuringBlocked).toBe(false)
  })

  it("structuringIsEmpty is true for fully empty payload", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput())
    expect(result.data.scenarioDefinitionStructuringContract.summary.structuringIsEmpty).toBe(
      true,
    )
  })

  it("structuringIsEmpty is false for non-empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        draftPackagePayload: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["e"],
          completionNotes: null,
        },
      }),
    )
    expect(result.data.scenarioDefinitionStructuringContract.summary.structuringIsEmpty).toBe(
      false,
    )
  })

  it("structuringMarkedComplete mirrors packageMarkedComplete", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput()).data
        .scenarioDefinitionStructuringContract.summary.structuringMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
        buildInput({
          summary: {
            hasPackageTarget: true,
            packageBlocked: false,
            packageIsEmpty: false,
            packageMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionStructuringContract.summary.structuringMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when structuringReady is false", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_BLOCKED",
      message: "Scenario-definition structuring contract is not ready for downstream shaping.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        queueItemCode: null,
        packageTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_TARGET",
      message:
        "No scenario-definition structuring contract target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when structuring payload is empty", () => {
    const result =
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_EMPTY",
      message:
        "Scenario-definition structuring contract is empty and does not yet contain structuring content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when payload has content", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(
      buildInput({
        draftPackagePayload: {
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
        (w) => w.code === "AUTHORING_SCENARIO_DEFINITION_STRUCTURING_CONTRACT_EMPTY",
      ),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      draftPackagePayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["z"],
        completionNotes: null,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(input),
    ).toEqual(buildScenarioDraftAuthoringScenarioDefinitionStructuringContract(input))
  })
})
