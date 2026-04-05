/**
 * Write-through: financial inputs → leakage trace → Action Center items → merge with persistence → upsert.
 *
 * Future hook points (not implemented here): call {@link writeThroughActionCenter} when real pipeline
 * data changes, e.g. after visit logging, event ingestion, invoice/claims recomputation, or a nightly
 * reconciliation job. Pass the same-shaped {@link ActionCenterWriteThroughInput} built from live sources.
 */
import { buildLeakageTrace } from "../post-award-ledger/build-leakage-trace"
import { buildActionCenter } from "./build-action-center"
import { getActionCenterPersistenceAdapter } from "./get-persistence-adapter"
import { mergeGeneratedActionItems } from "./merge-generated-action-items"
import { appendWriteThroughChangeEvents } from "./write-through-events"
import type {
  ActionCenterWriteThroughInput,
  ActionCenterWriteThroughResult,
} from "./write-through-types"

export async function writeThroughActionCenter(
  input: ActionCenterWriteThroughInput,
): Promise<ActionCenterWriteThroughResult> {
  try {
    const leakageTrace = buildLeakageTrace({
      expectedBillables: input.expectedBillables,
      ledgerRows: input.ledgerRows,
      claimItems: input.claimItems,
      invoicePackages: input.invoicePackages,
    })
    const { items: generatedItems } = buildActionCenter({ leakageTrace })

    const adapter = getActionCenterPersistenceAdapter()
    const persistedItems = await adapter.listActionItems()
    const { itemsToUpsert, insertedCount, updatedCount, unchangedCount } = mergeGeneratedActionItems({
      persistedItems,
      generatedItems,
    })

    if (itemsToUpsert.length > 0) {
      const persistedItemIds = new Set(persistedItems.map((i) => i.id))
      await adapter.upsertActionItems(itemsToUpsert)
      await appendWriteThroughChangeEvents(adapter, { persistedItemIds, itemsToUpsert })
    }

    return {
      items: generatedItems,
      insertedCount,
      updatedCount,
      unchangedCount,
    }
  } catch {
    throw new Error("failed_to_write_through_action_center")
  }
}
