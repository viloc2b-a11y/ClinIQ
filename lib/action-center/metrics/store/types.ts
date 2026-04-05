export type ActionCenterMetrics = {
  writesAttempted: number
  writesSuccess: number
  writesFailed: number
}

export interface ActionCenterMetricsStore {
  get(): Promise<ActionCenterMetrics>
  set(metrics: ActionCenterMetrics): Promise<void>
  reset(): Promise<void>
}
