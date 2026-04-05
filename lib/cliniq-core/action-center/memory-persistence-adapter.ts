import type { ActionCenterPersistenceAdapter } from "./persistence-adapter"
import type { ActionItemEventRow } from "./persistence-types"
import type { ActionCenterItem } from "./types"

/** Shared store: every {@link MemoryPersistenceAdapter} instance reads/writes here. */
const sharedItems = new Map<string, ActionCenterItem>()
const sharedEvents: ActionItemEventRow[] = []

export function resetMemoryPersistenceAdapterState(): void {
  sharedItems.clear()
  sharedEvents.length = 0
}

function newEventId(): string {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

/**
 * In-memory implementation of {@link ActionCenterPersistenceAdapter}.
 * Swap for a Supabase-backed adapter later without changing call sites.
 */
export class MemoryPersistenceAdapter implements ActionCenterPersistenceAdapter {
  constructor(initialItems?: ActionCenterItem[]) {
    if (initialItems) {
      for (const item of initialItems) {
        sharedItems.set(item.id, { ...item })
      }
    }
  }

  async listActionItems(): Promise<ActionCenterItem[]> {
    return [...sharedItems.values()]
  }

  async upsertActionItems(items: ActionCenterItem[]): Promise<void> {
    for (const item of items) {
      sharedItems.set(item.id, { ...item })
    }
  }

  async updateActionItemStatus(params: {
    itemId: string
    status: "open" | "in_progress" | "blocked" | "resolved"
  }): Promise<void> {
    const item = sharedItems.get(params.itemId)
    if (!item) {
      throw new Error("item_not_found")
    }
    sharedItems.set(params.itemId, { ...item, status: params.status })
  }

  async appendActionItemEvent(params: {
    actionItemId: string
    eventType: string
    fromStatus?: string
    toStatus?: string
    actorType?: string
    actorId?: string
    note?: string
    payload?: Record<string, unknown>
  }): Promise<void> {
    const row: ActionItemEventRow = {
      id: newEventId(),
      action_item_id: params.actionItemId,
      event_type: params.eventType,
      from_status: params.fromStatus ?? null,
      to_status: params.toStatus ?? null,
      actor_type: params.actorType ?? "system",
      actor_id: params.actorId ?? null,
      note: params.note ?? null,
      payload: params.payload ?? {},
      created_at: new Date().toISOString(),
    }
    sharedEvents.push(row)
  }
}

export function createMemoryPersistenceAdapter(
  initialItems?: ActionCenterItem[],
): ActionCenterPersistenceAdapter {
  return new MemoryPersistenceAdapter(initialItems)
}
