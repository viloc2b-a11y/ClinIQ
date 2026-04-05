import { buildLeakageTrace } from "../post-award-ledger/build-leakage-trace"
import { buildActionCenter } from "./build-action-center"
import { mockActionCenterInput } from "./mock-action-center-input"
import type { ActionCenterApiResponse } from "./api-types"

/**
 * Mock pipeline: fixture → leakage trace → action center (sync, no I/O).
 */
export function getActionCenter(): ActionCenterApiResponse {
  try {
    const leakageTrace = buildLeakageTrace(mockActionCenterInput)
    const data = buildActionCenter({ leakageTrace })
    return { ok: true, data }
  } catch {
    return { ok: false, error: "failed_to_build_action_center" }
  }
}
