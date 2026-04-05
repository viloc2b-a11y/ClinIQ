/**
 * @deprecated Prefer `buildActionCenter({ leakageTrace })` from `./build-action-center`.
 */

import type { LeakageTraceResult } from "../post-award-ledger/leakage-types"
import { buildActionCenter } from "./build-action-center"

export function buildActionCenterFromLeakageTrace(
  leakageTrace: LeakageTraceResult,
): ReturnType<typeof buildActionCenter> {
  return buildActionCenter({ leakageTrace })
}
