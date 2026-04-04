import { BILLABLE_SUBJECT_DEDUPE_NIL } from "./types"

/**
 * Identity for operational dedupe: matches `billable_instances.subject_dedupe` + study/fee/event.
 */
export type BillableSourceKey = {
  studyId: string
  feeCode: string
  sourceEventId: string
  subjectId: string | null
}

export function subjectDedupeKey(subjectId: string | null): string {
  return subjectId ?? BILLABLE_SUBJECT_DEDUPE_NIL
}

export function sameBillableSourceKey(a: BillableSourceKey, b: BillableSourceKey): boolean {
  return (
    a.studyId === b.studyId &&
    a.feeCode === b.feeCode &&
    a.sourceEventId === b.sourceEventId &&
    subjectDedupeKey(a.subjectId) === subjectDedupeKey(b.subjectId)
  )
}
