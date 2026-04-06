import type { ScenarioDraftAuthoringCoverageResult } from "../scenario-draft-authoring-coverage/types"
import { evaluateAuthoringReadiness } from "./evaluate-authoring-readiness"
import type { ScenarioDraftAuthoringReadinessResult } from "./types"

export function buildScenarioDraftAuthoringReadiness(
  coverageResult: ScenarioDraftAuthoringCoverageResult,
): ScenarioDraftAuthoringReadinessResult {
  const warnings: ScenarioDraftAuthoringReadinessResult["warnings"] = []

  const readiness = evaluateAuthoringReadiness(coverageResult)

  if (readiness.status === "not_ready") {
    warnings.push({
      code: "AUTHORING_NOT_READY",
      message: "Scenario draft authoring input is not ready for kickoff.",
      severity: "warning",
    })
  }

  if (readiness.status === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_READY_WITH_WARNINGS",
      message: "Scenario draft authoring input is structurally ready but has warning conditions.",
      severity: "warning",
    })
  }

  return {
    data: {
      readiness,
    },
    summary: {
      status: readiness.status,
      totalWorksets: coverageResult.summary.totalWorksets,
      totalScheduledItems: coverageResult.summary.totalScheduledItems,
      representedFamilyCount: coverageResult.summary.representedFamilyCount,
      representedStructureIntentCount: coverageResult.summary.representedStructureIntentCount,
      nullFamilyRepresented: coverageResult.summary.nullFamilyRepresented,
    },
    warnings,
  }
}
