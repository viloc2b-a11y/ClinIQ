import type { ActionCenterItem } from "./types"
import type { ActionCenterRowAction } from "./row-actions"

export interface ActionCenterMutationResult {
  items: ActionCenterItem[]
}

export interface ApplyRowActionParams {
  items: ActionCenterItem[]
  itemId: string
  action: ActionCenterRowAction
}
