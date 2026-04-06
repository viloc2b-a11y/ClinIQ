import type { ScenarioDraftAuthoringExecutionRelayTokenResult } from "../scenario-draft-authoring-execution-relay-token/types"
import type { ScenarioDraftAuthoringExecutionHandoffCapsuleResult } from "./types"

export function buildScenarioDraftAuthoringExecutionHandoffCapsule(
  executionRelayTokenResult: ScenarioDraftAuthoringExecutionRelayTokenResult,
): ScenarioDraftAuthoringExecutionHandoffCapsuleResult {
  const warnings: ScenarioDraftAuthoringExecutionHandoffCapsuleResult["warnings"] = []

  const executionRelayToken = executionRelayTokenResult.data.executionRelayToken

  const handoffActive = executionRelayToken.relayActive
  const sessionCode = executionRelayToken.sessionCode
  const worksetCode = executionRelayToken.worksetCode
  const queueItemCode = executionRelayToken.queueItemCode
  const remainingSessionCount = executionRelayToken.remainingSessionCount
  const totalPlannedItems = executionRelayToken.totalPlannedItems

  const hasHandoffTarget = sessionCode !== null
  const handoffBlocked = !handoffActive

  if (!handoffActive) {
    warnings.push({
      code: "AUTHORING_EXECUTION_HANDOFF_BLOCKED",
      message: "Scenario draft authoring execution handoff capsule is not active and cannot proceed.",
      severity: "warning",
    })
  }

  if (!hasHandoffTarget) {
    warnings.push({
      code: "NO_EXECUTION_HANDOFF_TARGET",
      message: "No execution handoff target is available because no execution-relay session target exists.",
      severity: "info",
    })
  }

  return {
    data: {
      executionHandoffCapsule: {
        handoffActive,
        sessionCode,
        worksetCode,
        queueItemCode,
        remainingSessionCount,
        totalPlannedItems,
        summary: {
          hasHandoffTarget,
          handoffBlocked,
        },
      },
    },
    summary: {
      handoffActive,
      sessionCode,
      remainingSessionCount,
      totalPlannedItems,
    },
    warnings,
  }
}
