import type { ActionCenterResult } from "./types"

export interface GetActionCenterResponse {
  ok: true
  data: ActionCenterResult
}

export interface GetActionCenterErrorResponse {
  ok: false
  error: string
}

export type ActionCenterApiResponse = GetActionCenterResponse | GetActionCenterErrorResponse
