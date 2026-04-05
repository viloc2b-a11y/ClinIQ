export function buildRevenueActionItemsInput(params: {
  persistedItems: Array<{
    id: string
    type: string
    title: string
    estimatedValue: number
    sourceTrace?: Record<string, unknown> | null
  }>
}) {
  const actionItems = params.persistedItems.map((item) => ({
    id: `action-${item.id}`,
    type: "missing_billable",
    title: item.title,
    estimatedValue: item.estimatedValue || 0,
    sourceTrace: item.sourceTrace || null,
  }))

  return {
    data: {
      actionItems,
    },
    summary: {
      totalActionItems: actionItems.length,
    },
    warnings: [],
  }
}
