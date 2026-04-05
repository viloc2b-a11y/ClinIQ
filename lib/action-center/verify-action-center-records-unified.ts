import { verifyActionCenterRecords } from "./verify-action-center-records"
import { verifyActionCenterRecordsPaged } from "./verify-action-center-records-paged"
import { getVerifyStatus } from "./summary/status"

import type { ActionCenterVerifySummary } from "./summary/types"

export type VerifyActionCenterRecordsUnifiedInput = {
  expectedIds: string[]
  mode?: "full" | "paged"
  pageSize?: number
}

export type VerifyActionCenterRecordsUnifiedResult = ActionCenterVerifySummary

export async function verifyActionCenterRecordsUnified(
  input: VerifyActionCenterRecordsUnifiedInput,
): Promise<ActionCenterVerifySummary> {
  if (input.mode === "paged") {
    const result = await verifyActionCenterRecordsPaged({
      expectedIds: input.expectedIds,
      pageSize: input.pageSize,
    })

    return {
      ...result,
      mode: "paged",
      status: getVerifyStatus({
        missing: result.missing,
      }),
    }
  }

  const result = await verifyActionCenterRecords({
    expectedIds: input.expectedIds,
  })

  return {
    ...result,
    mode: "full",
    status: getVerifyStatus({
      missing: result.missing,
    }),
  }
}
