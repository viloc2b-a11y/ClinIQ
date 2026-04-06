import { describe, expect, it } from "vitest"

import type { ScenarioDraftAuthoringFinalizedDraftHandoffContractResult } from "../scenario-draft-authoring-finalized-draft-handoff-contract/types"
import { buildScenarioDraftAuthoringScenarioDefinitionDraftPackage } from "./build-scenario-draft-authoring-scenario-definition-draft-package"

const defaultHandoffContract: ScenarioDraftAuthoringFinalizedDraftHandoffContractResult["data"]["finalizedDraftHandoffContract"] =
  {
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
  }

function buildInput(
  overrides?: Partial<
    ScenarioDraftAuthoringFinalizedDraftHandoffContractResult["data"]["finalizedDraftHandoffContract"]
  >,
): ScenarioDraftAuthoringFinalizedDraftHandoffContractResult {
  const finalizedDraftHandoffContract = {
    ...defaultHandoffContract,
    ...overrides,
    handoffTarget: {
      sessionCode: overrides?.sessionCode ?? defaultHandoffContract.sessionCode,
      worksetCode: overrides?.worksetCode ?? defaultHandoffContract.worksetCode,
      queueItemCode: overrides?.queueItemCode ?? defaultHandoffContract.queueItemCode,
      ...overrides?.handoffTarget,
    },
    handoffPayload: {
      ...defaultHandoffContract.handoffPayload,
      ...overrides?.handoffPayload,
      edgeCases: overrides?.handoffPayload?.edgeCases ?? [
        ...defaultHandoffContract.handoffPayload.edgeCases,
      ],
    },
    summary: {
      ...defaultHandoffContract.summary,
      ...overrides?.summary,
    },
  }

  return {
    data: { finalizedDraftHandoffContract },
    summary: {
      handoffReady: finalizedDraftHandoffContract.handoffReady,
      sessionCode: finalizedDraftHandoffContract.sessionCode,
      queueItemCode: finalizedDraftHandoffContract.queueItemCode,
      handoffIsEmpty: finalizedDraftHandoffContract.summary.handoffIsEmpty,
      handoffMarkedComplete: finalizedDraftHandoffContract.summary.handoffMarkedComplete,
      remainingSessionCount: finalizedDraftHandoffContract.remainingSessionCount,
      totalPlannedItems: finalizedDraftHandoffContract.totalPlannedItems,
    },
    warnings: [],
  }
}

describe("buildScenarioDraftAuthoringScenarioDefinitionDraftPackage", () => {
  it("matches the expected result shape", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput())

    expect(result).toEqual({
      data: {
        scenarioDefinitionDraftPackage: {
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
        },
      },
      summary: {
        packageReady: false,
        sessionCode: "session-001",
        queueItemCode: "queue-item-001",
        packageIsEmpty: true,
        packageMarkedComplete: false,
        remainingSessionCount: 1,
        totalPlannedItems: 10,
      },
      warnings: [
        {
          code: "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_BLOCKED",
          message: "Scenario-definition draft package is not ready for downstream structuring.",
          severity: "warning",
        },
        {
          code: "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_EMPTY",
          message:
            "Scenario-definition draft package is empty and does not yet contain draft packaging content.",
          severity: "info",
        },
      ],
    })
  })

  it("copies session, workset, and queue item codes", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        sessionCode: "s-1",
        worksetCode: "w-2",
        queueItemCode: "q-3",
      }),
    )
    const pkg = result.data.scenarioDefinitionDraftPackage
    expect(pkg.sessionCode).toBe("s-1")
    expect(pkg.worksetCode).toBe("w-2")
    expect(pkg.queueItemCode).toBe("q-3")
  })

  it("copies packageTarget from session, workset, and queue item", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        sessionCode: "a",
        worksetCode: "b",
        queueItemCode: "c",
      }),
    )
    expect(result.data.scenarioDefinitionDraftPackage.packageTarget).toEqual({
      sessionCode: "a",
      worksetCode: "b",
      queueItemCode: "c",
    })
  })

  it("copies remainingSessionCount and totalPlannedItems", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({ remainingSessionCount: 4, totalPlannedItems: 30 }),
    )
    expect(result.data.scenarioDefinitionDraftPackage.remainingSessionCount).toBe(4)
    expect(result.data.scenarioDefinitionDraftPackage.totalPlannedItems).toBe(30)
    expect(result.summary.remainingSessionCount).toBe(4)
    expect(result.summary.totalPlannedItems).toBe(30)
  })

  it("copies handoff payload into draftPackagePayload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        handoffPayload: {
          title: "T",
          objective: "O",
          trigger: "Tr",
          expectedBehavior: "E",
          edgeCases: ["x"],
          completionNotes: "n",
        },
      }),
    )
    expect(result.data.scenarioDefinitionDraftPackage.draftPackagePayload).toEqual({
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
      handoffPayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["orig"],
        completionNotes: null,
      },
    })
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(input)
    result.data.scenarioDefinitionDraftPackage.draftPackagePayload.edgeCases.push("leak")
    expect(input.data.finalizedDraftHandoffContract.handoffPayload.edgeCases).toEqual(["orig"])
  })

  it("packageReady mirrors handoffReady", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
        buildInput({ handoffReady: false }),
      ).data.scenarioDefinitionDraftPackage.packageReady,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
        buildInput({
          handoffReady: true,
          summary: {
            hasHandoffTarget: true,
            handoffBlocked: false,
            handoffIsEmpty: false,
            handoffMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionDraftPackage.packageReady,
    ).toBe(true)
  })

  it("computes hasPackageTarget from queueItemCode", () => {
    const withQ = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput())
    expect(withQ.data.scenarioDefinitionDraftPackage.summary.hasPackageTarget).toBe(true)

    const noQ = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        queueItemCode: null,
        handoffTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(noQ.data.scenarioDefinitionDraftPackage.summary.hasPackageTarget).toBe(false)
  })

  it("computes packageBlocked as negation of packageReady", () => {
    const blocked = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput())
    expect(blocked.data.scenarioDefinitionDraftPackage.summary.packageBlocked).toBe(true)

    const open = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        handoffReady: true,
        summary: {
          hasHandoffTarget: true,
          handoffBlocked: false,
          handoffIsEmpty: false,
          handoffMarkedComplete: true,
        },
      }),
    )
    expect(open.data.scenarioDefinitionDraftPackage.summary.packageBlocked).toBe(false)
  })

  it("packageIsEmpty is true for fully empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput())
    expect(result.data.scenarioDefinitionDraftPackage.summary.packageIsEmpty).toBe(true)
  })

  it("packageIsEmpty is false for non-empty payload", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        handoffPayload: {
          title: null,
          objective: null,
          trigger: null,
          expectedBehavior: null,
          edgeCases: ["e"],
          completionNotes: null,
        },
      }),
    )
    expect(result.data.scenarioDefinitionDraftPackage.summary.packageIsEmpty).toBe(false)
  })

  it("packageMarkedComplete mirrors handoffMarkedComplete", () => {
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput()).data
        .scenarioDefinitionDraftPackage.summary.packageMarkedComplete,
    ).toBe(false)
    expect(
      buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
        buildInput({
          summary: {
            hasHandoffTarget: true,
            handoffBlocked: false,
            handoffIsEmpty: false,
            handoffMarkedComplete: true,
          },
        }),
      ).data.scenarioDefinitionDraftPackage.summary.packageMarkedComplete,
    ).toBe(true)
  })

  it("emits blocked warning when packageReady is false", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_BLOCKED",
      message: "Scenario-definition draft package is not ready for downstream structuring.",
      severity: "warning",
    })
  })

  it("emits no-target info when queue item is null", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        queueItemCode: null,
        handoffTarget: {
          sessionCode: "session-001",
          worksetCode: "workset-001",
          queueItemCode: null,
        },
      }),
    )
    expect(result.warnings).toContainEqual({
      code: "NO_AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_TARGET",
      message:
        "No scenario-definition draft package target is available because no queue item target exists.",
      severity: "info",
    })
  })

  it("emits empty info when package payload is empty", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(buildInput())
    expect(result.warnings).toContainEqual({
      code: "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_EMPTY",
      message:
        "Scenario-definition draft package is empty and does not yet contain draft packaging content.",
      severity: "info",
    })
  })

  it("does not emit empty warning when payload has content", () => {
    const result = buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(
      buildInput({
        handoffPayload: {
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
      result.warnings.some((w) => w.code === "AUTHORING_SCENARIO_DEFINITION_DRAFT_PACKAGE_EMPTY"),
    ).toBe(false)
  })

  it("does not mutate input", () => {
    const input = buildInput({
      handoffPayload: {
        title: null,
        objective: null,
        trigger: null,
        expectedBehavior: null,
        edgeCases: ["z"],
        completionNotes: null,
      },
    })
    const before = structuredClone(input)
    buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(input)
    expect(input).toEqual(before)
  })

  it("is deterministic for identical input", () => {
    const input = buildInput()
    expect(buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(input)).toEqual(
      buildScenarioDraftAuthoringScenarioDefinitionDraftPackage(input),
    )
  })
})
