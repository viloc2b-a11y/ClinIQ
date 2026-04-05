import type { ActionCenterItem } from "./types"

export interface ActionCenterPersistenceAdapter {
  listActionItems(): Promise<ActionCenterItem[]>
  upsertActionItems(items: ActionCenterItem[]): Promise<void>
  updateActionItemStatus(params: {
    itemId: string
    status: "open" | "in_progress" | "blocked" | "resolved"
  }): Promise<void>
  appendActionItemEvent(params: {
    actionItemId: string
    eventType: string
    fromStatus?: string
    toStatus?: string
    actorType?: string
    actorId?: string
    note?: string
    payload?: Record<string, unknown>
  }): Promise<void>
}
