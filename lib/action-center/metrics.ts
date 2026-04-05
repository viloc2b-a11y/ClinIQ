import { getActionCenterMetricsStore } from "./metrics/store/get-store"
import type { ActionCenterMetrics } from "./metrics/store/types"

export type { ActionCenterMetrics } from "./metrics/store/types"

export async function trackWriteAttempt(): Promise<void> {
  const store = getActionCenterMetricsStore()
  const metrics = await store.get()

  await store.set({
    ...metrics,
    writesAttempted: metrics.writesAttempted + 1,
  })
}

export async function trackWriteSuccess(): Promise<void> {
  const store = getActionCenterMetricsStore()
  const metrics = await store.get()

  await store.set({
    ...metrics,
    writesSuccess: metrics.writesSuccess + 1,
  })
}

export async function trackWriteFail(): Promise<void> {
  const store = getActionCenterMetricsStore()
  const metrics = await store.get()

  await store.set({
    ...metrics,
    writesFailed: metrics.writesFailed + 1,
  })
}

export async function getMetrics(): Promise<ActionCenterMetrics> {
  const store = getActionCenterMetricsStore()
  return store.get()
}

export async function resetMetrics(): Promise<void> {
  const store = getActionCenterMetricsStore()
  await store.reset()
}
