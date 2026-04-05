export function buildRevenueRecordsInput(params: {
  persistedItems: Array<{
    id: string
    type: string
    title: string
    estimatedValue: number
    sourceTrace?: Record<string, unknown> | null
  }>
}) {
  const records = params.persistedItems.map((item, index) => ({
    id: item.id,
    type: "billable_instance",
    studyId: "DOCUMENT-STUDY",
    siteId: "DOCUMENT-SITE",
    subjectId: `DOC-SUBJECT-${index + 1}`,
    visitName: item.title,
    lineCode: item.type,
    amount: item.estimatedValue || 0,
    status: "ready",
    eventLogId: `doc-event-${index + 1}`,
    sourceTrace: item.sourceTrace || null,
  }))

  return {
    data: {
      records,
    },
    summary: {
      totalRecords: records.length,
    },
    warnings: [],
  }
}
