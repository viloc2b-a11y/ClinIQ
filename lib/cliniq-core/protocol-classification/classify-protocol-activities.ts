import { classifyActivity } from "./rules"
import type { ProtocolClassifiedActivity, SoARow } from "./types"

/**
 * Classify each SoA-shaped row in order (deterministic, one pass).
 */
export function classifyProtocolActivities(
  rows: SoARow[],
): ProtocolClassifiedActivity[] {
  return rows.map((row) => classifyActivity(row))
}
