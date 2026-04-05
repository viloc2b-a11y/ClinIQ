export function buildActionCenterWritePayload(params: {
  seeds: Array<{
    seedId: string
    type: string
    title: string
    estimatedValue: number
    sourceTrace?: Record<string, unknown> | null
  }>
}) {
  const items = params.seeds.map((seed) => ({
    id: seed.seedId,
    type: seed.type,
    title: seed.title,
    estimatedValue: seed.estimatedValue,
    sourceTrace: seed.sourceTrace || null,
  }))

  return {
    data: {
      writePayload: {
        items,
      },
    },
    summary: {
      totalItems: items.length,
    },
    warnings: [],
  }
}
