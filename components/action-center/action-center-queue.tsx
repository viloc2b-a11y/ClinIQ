"use client"

import { ActionCenterDetailDrawer } from "@/components/action-center/action-center-detail-drawer"
import { ActionCenterWorkQueue } from "@/components/action-center/action-center-table"
import type { ActionCenterItem } from "@/lib/cliniq-core/action-center"
import type { ActionCenterRowAction } from "@/lib/cliniq-core/action-center/row-actions"

export function ActionCenterQueue({
  items,
  selectedItem,
  onItemSelect,
  onCloseDrawer,
  onAction,
}: {
  items: ActionCenterItem[]
  selectedItem: ActionCenterItem | null
  onItemSelect: (item: ActionCenterItem) => void
  onCloseDrawer: () => void
  onAction: (action: ActionCenterRowAction, item: ActionCenterItem) => void | Promise<void>
}) {
  const selectedItemId = selectedItem?.id ?? null

  return (
    <>
      <section aria-label="Work queue" className="mt-12 sm:mt-14">
        <h2 className="text-foreground mb-5 text-base font-semibold tracking-tight sm:text-lg">
          Queue
        </h2>
        <ActionCenterWorkQueue
          items={items}
          selectedItemId={selectedItemId}
          onItemSelect={onItemSelect}
        />
      </section>

      <ActionCenterDetailDrawer
        item={selectedItem}
        open={selectedItem !== null}
        onClose={onCloseDrawer}
        onAction={onAction}
      />
    </>
  )
}
