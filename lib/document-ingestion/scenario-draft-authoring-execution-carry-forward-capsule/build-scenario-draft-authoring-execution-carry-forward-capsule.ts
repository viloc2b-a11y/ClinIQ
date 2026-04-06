import type { ScenarioDraftAuthoringExecutionStateBatonResult } from "../scenario-draft-authoring-execution-state-baton/types"
import type { ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionCarryForwardCapsule(
  executionStateBatonResult: ScenarioDraftAuthoringExecutionStateBatonResult,
): ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult["warnings"] = []

  const executionStateBaton = executionStateBatonResult.data.executionStateBaton

  const carryForwardActive = executionStateBaton.executionStateActive
  const sessionCode = executionStateBaton.sessionCode
  const worksetCode = executionStateBaton.worksetCode
  const queueItemCode = executionStateBaton.queueItemCode
  const remainingSessionCount = executionStateBaton.remainingSessionCount
  const totalPlannedItems = executionStateBaton.totalPlannedItems

  const hasCarryForwardTarget = sessionCode !== null
  const carryForwardBlocked = !carryForwardActive

  if (!carryForwardActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_CARRY_FORWARD_BLOCKED",
      message: "Scenario draft authoring execution carry-forward capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasCarryForwardTarget) {
    warnings.push({
      code: "NO_EXECUTION_CARRY_FORWARD_TARGET",
      message: "No execution carry-forward target is available because no execution-state session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionCarryForwardCapsule: {
        carryForwardActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasCarryForwardTarget,
          carryForwardBlocked,
        },
      },
    },
    summary: {
      carryForwardActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
