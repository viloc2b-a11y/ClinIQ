import type { ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult } from "../scenario-draft-authoring-execution-carry-forward-capsule/types"
import type { ScenarioDraftAuthoringExecutionRelayTokenResult } from "./types"

export function buildScenarioDraftAuthoringExecutionRelayToken(
  executionCarryForwardCapsuleResult: ScenarioDraftAuthoringExecutionCarryForwardCapsuleResult,
): ScenarioDraftAuthoringExecutionRelayTokenResult {
  const warnings: ScenarioDraftAuthoringExecutionRelayTokenResult["warnings"] = []

  const executionCarryForwardCapsule =
    executionCarryForwardCapsuleResult.data.executionCarryForwardCapsule

  const relayActive = executionCarryForwardCapsule.carryForwardActive
  const sessionCode = executionCarryForwardCapsule.sessionCode
  const worksetCode = executionCarryForwardCapsule.worksetCode
  const queueItemCode = executionCarryForwardCapsule.queueItemCode
  const remainingSessionCount = executionCarryForwardCapsule.remainingSessionCount
  const totalPlannedItems = executionCarryForwardCapsule.totalPlannedItems

  const hasRelayTarget = sessionCode !== null
  const relayBlocked = !relayActive

  if (!relayActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_RELAY_BLOCKED",
      message: "Scenario draft authoring execution relay token is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasRelayTarget) {
    warnings.push({
      code: "NO_EXECUTION_RELAY_TARGET",
      message: "No execution relay target is available because no carry-forward session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionRelayToken: {
        relayActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasRelayTarget,
          relayBlocked,
        },
      },
    },
    summary: {
      relayActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
