const metrics = {
  writesAttempted: 0,
  writesSuccess: 0,
  writesFailed: 0,
}

export function trackWriteAttempt(): void {
  metrics.writesAttempted += 1
}

export function trackWriteSuccess(): void {
  metrics.writesSuccess += 1
}

export function trackWriteFail(): void {
  metrics.writesFailed += 1
}

export function getMetrics(): Readonly<typeof metrics> {
  return { ...metrics }
}

/** Tests / isolated runs */
export function resetMetrics(): void {
  metrics.writesAttempted = 0
  metrics.writesSuccess = 0
  metrics.writesFailed = 0
}
