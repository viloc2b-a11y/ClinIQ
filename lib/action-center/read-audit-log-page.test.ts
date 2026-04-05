import { beforeEach, describe, expect, it } from "vitest"

import { appendAudit, resetAuditLog } from "./audit-log"
import { resetActionCenterAuditStoreCache } from "./audit/store/get-store"
import { readAuditLogPage } from "./read-audit-log-page"

describe("readAuditLogPage", () => {
  beforeEach(async () => {
    resetActionCenterAuditStoreCache()
    await resetAuditLog()
  })

  it("reads paged audit history", async () => {
    await appendAudit({
      id: "a",
      step: "write_attempt",
      timestamp: "2026-04-05T00:00:00.000Z",
    })

    await appendAudit({
      id: "a",
      step: "write_success",
      timestamp: "2026-04-05T00:00:01.000Z",
    })

    await appendAudit({
      id: "b",
      step: "write_fail",
      timestamp: "2026-04-05T00:00:02.000Z",
    })

    const first = await readAuditLogPage({ limit: 2 })

    expect(first.records).toEqual([
      {
        id: "a",
        step: "write_attempt",
        timestamp: "2026-04-05T00:00:00.000Z",
      },
      {
        id: "a",
        step: "write_success",
        timestamp: "2026-04-05T00:00:01.000Z",
      },
    ])
    expect(typeof first.nextCursor).toBe("string")

    const second = await readAuditLogPage({
      limit: 2,
      cursor: first.nextCursor || undefined,
    })

    expect(second.records).toEqual([
      {
        id: "b",
        step: "write_fail",
        timestamp: "2026-04-05T00:00:02.000Z",
      },
    ])
    expect(second.nextCursor).toBeNull()
  })
})
