export function buildRecordsChainInput(params: {
  items: Array<{
    id: string
    type: string
    title: string
    estimatedValue: number
    sourceTrace?: Record<string, unknown> | null
  }>
}) {
  const recordsInput = params.items.map((item) => ({
    actionItemId: item.id,
    type: item.type,
    title: item.title,
    estimatedValue: item.estimatedValue,
    sourceTrace: item.sourceTrace || null,
  }))

  return {
    data: {
      recordsInput,
    },
    summary: {
      totalItems: recordsInput.length,
    },
    warnings: [],
  }
}
