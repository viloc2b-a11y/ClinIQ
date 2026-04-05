export function buildPersistedItemsInput(params: {
  actionCenter: {
    data: {
      persistableSeeds: Array<{
        seedId: string
        type: string
        title: string
        estimatedValue: number
        sourceTrace?: Record<string, unknown> | null
      }>
      writePayload: {
        items: Array<{
          id: string
          type: string
          title: string
          estimatedValue: number
          sourceTrace?: Record<string, unknown> | null
        }>
      } | null
    }
    summary: {
      status: "persisted" | "skipped" | "failed"
      attemptedWrite: boolean
      verified: boolean
    }
  }
}) {
  const items =
    params.actionCenter.data.writePayload?.items ||
    params.actionCenter.data.persistableSeeds.map((seed) => ({
      id: seed.seedId,
      type: seed.type,
      title: seed.title,
      estimatedValue: seed.estimatedValue,
      sourceTrace: seed.sourceTrace || null,
    }))

  return {
    data: {
      items,
    },
    summary: {
      totalItems: items.length,
    },
    warnings: [],
  }
}
