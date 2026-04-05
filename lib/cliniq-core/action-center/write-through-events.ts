import { buildActionItemFingerprint } from "./action-item-fingerprint"
import type { ActionCenterPersistenceAdapter } from "./persistence-adapter"
import type { ActionCenterItem } from "./types"

/**
 * After a successful upsert, records one event per inserted or materially updated row.
 * Unchanged and persisted-only orphans never reach `itemsToUpsert`, so they get no event here.
 */
export async function appendWriteThroughChangeEvents(
  adapter: ActionCenterPersistenceAdapter,
  params: {
    persistedItemIds: ReadonlySet<string>
    itemsToUpsert: ActionCenterItem[]
  },
): Promise<void> {
  for (const item of params.itemsToUpsert) {
    const isInsert = !params.persistedItemIds.has(item.id)
    await adapter.appendActionItemEvent({
      actionItemId: item.id,
      eventType: isInsert ? "generated" : "generated_updated",
      actorType: "system",
      payload: {
        source: "write_through_sync",
        fingerprint: buildActionItemFingerprint(item),
      },
    })
  }
}
