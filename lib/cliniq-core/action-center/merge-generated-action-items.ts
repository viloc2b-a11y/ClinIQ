import { areActionItemsEquivalent } from "./action-item-fingerprint"
import type { ActionCenterItem } from "./types"

export interface MergeGeneratedActionItemsResult {
  itemsToUpsert: ActionCenterItem[]
  insertedCount: number
  updatedCount: number
  unchangedCount: number
}

/**
 * Merges leakage-generated items with persisted queue rows. Workflow `status` is preserved
 * when refreshing facts. Persist-only rows (e.g. resolved items no longer generated) are
 * not returned here and are not deleted (v1).
 */
export function mergeGeneratedActionItems(params: {
  persistedItems: ActionCenterItem[]
  generatedItems: ActionCenterItem[]
}): MergeGeneratedActionItemsResult {
  const byId = new Map(params.persistedItems.map((p) => [p.id, p]))
  const generatedOrdered = [...params.generatedItems].sort((a, b) => a.id.localeCompare(b.id))

  const itemsToUpsert: ActionCenterItem[] = []
  let insertedCount = 0
  let updatedCount = 0
  let unchangedCount = 0

  for (const gen of generatedOrdered) {
    const prev = byId.get(gen.id)
    if (!prev) {
      itemsToUpsert.push(gen)
      insertedCount++
      continue
    }
    if (areActionItemsEquivalent(prev, gen)) {
      unchangedCount++
      continue
    }
    itemsToUpsert.push({ ...gen, status: prev.status })
    updatedCount++
  }

  return { itemsToUpsert, insertedCount, updatedCount, unchangedCount }
}
