import type { ActionCenterMetrics, ActionCenterMetricsStore } from "./types"

const defaultMetrics: ActionCenterMetrics = {
  writesAttempted: 0,
  writesSuccess: 0,
  writesFailed: 0,
}

let metrics: ActionCenterMetrics = { ...defaultMetrics }

export class MemoryActionCenterMetricsStore implements ActionCenterMetricsStore {
  async get(): Promise<ActionCenterMetrics> {
    return { ...metrics }
  }

  async set(next: ActionCenterMetrics): Promise<void> {
    metrics = { ...next }
  }

  async reset(): Promise<void> {
    metrics = { ...defaultMetrics }
  }
}
