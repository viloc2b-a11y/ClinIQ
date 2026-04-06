function normalizeToken(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || "unknown"
}

export function buildGlobalQueueCode(args: {
  queuePosition: number
  reviewPackCode: string
  draftCode: string
}): string {
  const queueToken = String(args.queuePosition).padStart(4, "0")
  const packToken = normalizeToken(args.reviewPackCode)
  const draftToken = normalizeToken(args.draftCode)

  return `AUTHORING_QUEUE_${queueToken}_${packToken}_${draftToken}`.toUpperCase()
}
