import type { ActionCenterRowAction } from "@/lib/cliniq-core/action-center/row-actions"
import type { ActionCenterItem } from "@/lib/cliniq-core/action-center/types"

export function handleRowAction(params: { action: ActionCenterRowAction; item: ActionCenterItem }) {
  console.log("Action Center row action", params)
}
