import { beforeEach, describe, expect, it } from "vitest"

import { appendAudit, resetAuditLog } from "./audit-log"
import { resetActionCenterAuditStoreCache } from "./audit/store/get-store"
import { readAuditLog } from "./read-audit-log"

describe("readAuditLog", () => {
  beforeEach(async () => {
    resetActionCenterAuditStoreCache()
    await resetAuditLog()
  })

  it("reads filtered audit history", async () => {
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

    const rows = await readAuditLog({
      id: "a",
    })

    expect(rows).toEqual([
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
  })
})
