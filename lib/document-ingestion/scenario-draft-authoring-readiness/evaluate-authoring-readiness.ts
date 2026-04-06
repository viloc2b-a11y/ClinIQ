import type { ScenarioDraftAuthoringCoverageResult } from "../scenario-draft-authoring-coverage/types"
import type {
  ScenarioDraftAuthoringReadinessChecks,
  ScenarioDraftAuthoringReadinessSnapshot,
} from "./types"

export function evaluateAuthoringReadiness(
  coverageResult: ScenarioDraftAuthoringCoverageResult,
): ScenarioDraftAuthoringReadinessSnapshot {
  const checks: ScenarioDraftAuthoringReadinessChecks = {
    hasWorksets: coverageResult.summary.totalWorksets > 0,
    allWorksetsPopulated: coverageResult.data.worksets.every((workset) => workset.totalItems > 0),
    hasScheduledItems: coverageResult.summary.totalScheduledItems > 0,
    hasRepresentedFamilies: coverageResult.summary.representedFamilyCount > 0,
    hasRepresentedStructureIntents: coverageResult.summary.representedStructureIntentCount > 0,
    hasNullFamilyRepresentation: coverageResult.summary.nullFamilyRepresented,
  }

  const structurallyReady =
    checks.hasWorksets &&
    checks.allWorksetsPopulated &&
    checks.hasScheduledItems &&
    checks.hasRepresentedFamilies &&
    checks.hasRepresentedStructureIntents

  const reasons: string[] = []

  if (!checks.hasWorksets) {
    reasons.push("No authoring worksets are available.")
  }

  if (!checks.allWorksetsPopulated) {
    reasons.push("One or more authoring worksets are empty.")
  }

  if (!checks.hasScheduledItems) {
    reasons.push("No scenario drafts are scheduled for authoring.")
  }

  if (!checks.hasRepresentedFamilies) {
    reasons.push("No scenario families are represented in authoring coverage.")
  }

  if (!checks.hasRepresentedStructureIntents) {
    reasons.push("No structure intents are represented in authoring coverage.")
  }

  if (checks.hasNullFamilyRepresentation) {
    reasons.push("Some scheduled scenario drafts do not have a family assignment.")
  }

  const status = !structurallyReady
    ? "not_ready"
    : checks.hasNullFamilyRepresentation
      ? "ready_with_warnings"
      : "ready"

  return {
    status,
    checks,
    reasons,
  }
}
