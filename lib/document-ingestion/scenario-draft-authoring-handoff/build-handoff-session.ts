import type { ScenarioDraftAuthoringSession } from "../scenario-draft-authoring-session-plan/types"
import type { ScenarioDraftAuthoringHandoffSession } from "./types"

export function buildHandoffSession(session: ScenarioDraftAuthoringSession): ScenarioDraftAuthoringHandoffSession {
  return {
    sessionCode: session.sessionCode,
    sessionPosition: session.sessionPosition,
    targetWorksetCode: session.targetWorksetCode,
    targetWorksetPosition: session.targetWorksetPosition,
    totalItems: session.totalItems,
    startQueuePosition: session.startQueuePosition,
    endQueuePosition: session.endQueuePosition,
    firstQueueItemCode: session.firstQueueItemCode,
    lastQueueItemCode: session.lastQueueItemCode,
    isFirstSession: session.sessionPosition === 1,
  }
}
