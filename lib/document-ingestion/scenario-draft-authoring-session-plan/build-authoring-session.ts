import type { ScenarioDraftAuthoringKickoffWorkset } from "../scenario-draft-authoring-kickoff/types"
import { buildSessionCode } from "./build-session-code"
import type { ScenarioDraftAuthoringSession } from "./types"

export function buildAuthoringSession(args: {
  sessionPosition: number
  workset: ScenarioDraftAuthoringKickoffWorkset
}): ScenarioDraftAuthoringSession {
  return {
    sessionCode: buildSessionCode(args.sessionPosition),
    sessionPosition: args.sessionPosition,
    targetWorksetCode: args.workset.worksetCode,
    targetWorksetPosition: args.workset.worksetPosition,
    totalItems: args.workset.totalItems,
    startQueuePosition: args.workset.startQueuePosition,
    endQueuePosition: args.workset.endQueuePosition,
    firstQueueItemCode: args.workset.firstQueueItemCode,
    lastQueueItemCode: args.workset.lastQueueItemCode,
  }
}
