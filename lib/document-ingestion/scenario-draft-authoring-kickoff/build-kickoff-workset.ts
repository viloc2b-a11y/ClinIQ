import type { ScenarioDraftAuthoringWorkset } from "../scenario-draft-authoring-worksets/types"
import type { ScenarioDraftAuthoringKickoffWorkset } from "./types"

export function buildKickoffWorkset(workset: ScenarioDraftAuthoringWorkset): ScenarioDraftAuthoringKickoffWorkset {
  return {
    worksetCode: workset.worksetCode,
    worksetPosition: workset.worksetPosition,
    totalItems: workset.summary.totalItems,
    startQueuePosition: workset.startQueuePosition,
    endQueuePosition: workset.endQueuePosition,
    firstQueueItemCode: workset.summary.firstQueueItemCode,
    lastQueueItemCode: workset.summary.lastQueueItemCode,
  }
}
