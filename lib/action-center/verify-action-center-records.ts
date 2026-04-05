import { readActionCenterRecords } from "./read-action-center-records"
import {
  buildActionCenterVerificationResult,
  type ActionCenterVerificationResult,
} from "./verification/build-verification-result"

export type VerifyActionCenterRecordsInput = {
  expectedIds: string[]
}

export type VerifyActionCenterRecordsResult = ActionCenterVerificationResult

/** Read-back for `lib/action-center/persistence` record store (not cliniq-core Action Center items). */
export async function verifyActionCenterRecords(
  input: VerifyActionCenterRecordsInput,
): Promise<VerifyActionCenterRecordsResult> {
  const expectedIds = Array.isArray(input.expectedIds) ? input.expectedIds : []
  const records = await readActionCenterRecords()

  return buildActionCenterVerificationResult({
    expectedIds,
    foundIds: records.map((r) => r.id),
  })
}
