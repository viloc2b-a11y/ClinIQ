import { getWriteAndVerifyStatus } from "./summary/status"
import { verifyActionCenterRecordsUnified } from "./verify-action-center-records-unified"
import { writeActionCenterRecords } from "./write-action-center-records"

import type { ActionCenterRecord } from "./persistence/types"
import type { ActionCenterWriteAndVerifySummary } from "./summary/types"

export type WriteAndVerifyActionCenterRecordsInput = {
  records: ActionCenterRecord[]
  expectedIds?: string[]
  mode?: "full" | "paged"
  pageSize?: number
}

export type WriteAndVerifyActionCenterRecordsResult = ActionCenterWriteAndVerifySummary

export async function writeAndVerifyActionCenterRecords(
  input: WriteAndVerifyActionCenterRecordsInput,
): Promise<ActionCenterWriteAndVerifySummary> {
  const records = Array.isArray(input.records) ? input.records : []

  const write = await writeActionCenterRecords(records)

  const expectedIds =
    Array.isArray(input.expectedIds) && input.expectedIds.length > 0
      ? input.expectedIds
      : records.map((r) => `${r.type}::${r.payload?.id || r.id}`)

  const verify = await verifyActionCenterRecordsUnified({
    expectedIds,
    mode: input.mode,
    pageSize: input.pageSize,
  })

  const status = getWriteAndVerifyStatus({
    write,
    verify,
  })

  return {
    status,
    write,
    verify,
    ok: status === "success",
  }
}
