import type { PersistableActionSeed } from "./types"

export function buildPersistableActionSeeds(params: {
  actionSeeds: Array<{
    seedId: string
    type: string
    title: string
    estimatedValue: number
    sourceTrace?: Record<string, unknown> | null
  }>
}) {
  const persistableSeeds: PersistableActionSeed[] = params.actionSeeds.map((seed) => ({
    seedId: seed.seedId,
    type: seed.type,
    title: seed.title,
    estimatedValue: seed.estimatedValue,
    sourceTrace: seed.sourceTrace || null,
  }))

  return {
    data: {
      persistableSeeds,
    },
    summary: {
      totalSeeds: persistableSeeds.length,
    },
    warnings: [],
  }
}
