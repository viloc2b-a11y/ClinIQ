import { readActionCenterRecordsPage } from "./read-action-center-records-page"
import {
  buildActionCenterVerificationResult,
  type ActionCenterVerificationResult,
} from "./verification/build-verification-result"

export type VerifyActionCenterRecordsPagedInput = {
  expectedIds: string[]
  pageSize?: number
}

export type VerifyActionCenterRecordsPagedResult = ActionCenterVerificationResult & {
  pagesScanned: number
}

export async function verifyActionCenterRecordsPaged(
  input: VerifyActionCenterRecordsPagedInput,
): Promise<VerifyActionCenterRecordsPagedResult> {
  const expectedIds = Array.isArray(input.expectedIds) ? input.expectedIds : []
  const remaining = new Set(expectedIds)
  const matchedSet = new Set<string>()

  let cursor: string | undefined
  let pagesScanned = 0

  while (remaining.size > 0) {
    const page = await readActionCenterRecordsPage({
      limit: input.pageSize && input.pageSize > 0 ? input.pageSize : 100,
      cursor,
    })

    pagesScanned += 1

    for (const record of page.records) {
      if (remaining.has(record.id)) {
        remaining.delete(record.id)
        matchedSet.add(record.id)
      }
    }

    if (!page.nextCursor || page.records.length === 0) {
      break
    }

    cursor = page.nextCursor
  }

  return {
    ...buildActionCenterVerificationResult({
      expectedIds,
      foundIds: matchedSet,
    }),
    pagesScanned,
  }
}
