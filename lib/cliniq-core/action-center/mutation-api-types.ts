import type { ActionCenterResult } from "./types"
import type { ActionCenterRowAction } from "./row-actions"

export interface ActionCenterMutationRequest {
  itemId: string
  action: ActionCenterRowAction
}

export interface ActionCenterMutationSuccessResponse {
  ok: true
  data: {
    itemId: string
    action: ActionCenterRowAction
    result: ActionCenterResult
  }
}

export interface ActionCenterMutationErrorResponse {
  ok: false
  error:
    | "invalid_request"
    | "unsupported_action"
    | "item_not_found"
    | "failed_to_apply_action"
}

export type ActionCenterMutationApiResponse =
  | ActionCenterMutationSuccessResponse
  | ActionCenterMutationErrorResponse
