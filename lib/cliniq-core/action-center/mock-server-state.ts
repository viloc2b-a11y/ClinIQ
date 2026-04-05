import type { ActionCenterResult } from "./types"
import { getActionCenter } from "./get-action-center"

let cachedActionCenterResult: ActionCenterResult | null = null

export function getMockServerActionCenterState(): ActionCenterResult {
  if (!cachedActionCenterResult) {
    const initial = getActionCenter()
    if (!initial.ok) {
      throw new Error("failed_to_initialize_mock_server_state")
    }
    cachedActionCenterResult = initial.data
  }

  return cachedActionCenterResult
}

export function setMockServerActionCenterState(next: ActionCenterResult): void {
  cachedActionCenterResult = next
}

export function resetMockServerActionCenterState(): void {
  cachedActionCenterResult = null
}
