import type { ScenarioDraftAuthoringReadinessResult } from "../scenario-draft-authoring-readiness/types"
import type { ScenarioDraftAuthoringWorksetResult } from "../scenario-draft-authoring-worksets/types"
import { buildKickoffWorkset } from "./build-kickoff-workset"
import type { ScenarioDraftAuthoringKickoffResult } from "./types"

export function buildScenarioDraftAuthoringKickoff(args: {
  worksetResult: ScenarioDraftAuthoringWorksetResult
  readinessResult: ScenarioDraftAuthoringReadinessResult
}): ScenarioDraftAuthoringKickoffResult {
  const warnings: ScenarioDraftAuthoringKickoffResult["warnings"] = []

  const worksets = args.worksetResult.data.worksets.map((workset) => buildKickoffWorkset(workset))

  const readinessStatus = args.readinessResult.summary.status
  const kickoffReady = readinessStatus === "ready" || readinessStatus === "ready_with_warnings"

  if (!kickoffReady) {
    warnings.push({
      code: "AUTHORING_KICKOFF_NOT_READY",
      message: "Scenario draft authoring kickoff pack is not ready to start.",
      severity: "warning",
    })
  }

  if (readinessStatus === "ready_with_warnings") {
    warnings.push({
      code: "AUTHORING_KICKOFF_READY_WITH_WARNINGS",
      message: "Scenario draft authoring kickoff pack can start but includes warning conditions.",
      severity: "warning",
    })
  }

  const firstWorksetCode = worksets[0]?.worksetCode ?? null
  const firstQueueItemCode = worksets[0]?.firstQueueItemCode ?? null

  return {
    data: {
      kickoff: {
        readinessStatus,
        kickoffReady,
        firstWorksetCode,
        worksets,
        summary: {
          totalWorksets: worksets.length,
          totalScheduledItems: args.worksetResult.summary.totalQueueItems,
          hasNullFamilyRepresentation: args.readinessResult.summary.nullFamilyRepresented,
          firstQueueItemCode,
        },
      },
    },
    summary: {
      readinessStatus,
      kickoffReady,
      totalWorksets: worksets.length,
      totalScheduledItems: args.worksetResult.summary.totalQueueItems,
      firstWorksetCode,
    },
    warnings,
  }
}
