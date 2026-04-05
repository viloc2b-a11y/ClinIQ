import { describe, expect, it } from "vitest"

import type { ActionCenterAuditEntry } from "./store/types"
import {
  decodeAuditCursor,
  encodeAuditCursor,
  filterAuditRows,
  paginateAuditRows,
  sortAuditRows,
} from "./pagination"

describe("audit pagination helpers", () => {
  const rows: ActionCenterAuditEntry[] = [
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
    {
      id: "b",
      step: "write_fail",
      timestamp: "2026-04-05T00:00:02.000Z",
    },
  ]

  it("encodes and decodes cursor", () => {
    const cursor = encodeAuditCursor({
      timestamp: "2026-04-05T00:00:00.000Z",
      id: "a",
      step: "write_attempt",
    })

    expect(decodeAuditCursor(cursor)).toEqual({
      timestamp: "2026-04-05T00:00:00.000Z",
      id: "a",
      step: "write_attempt",
    })
  })

  it("sorts deterministically", () => {
    expect(sortAuditRows([...rows].reverse())).toEqual(rows)
  })

  it("filters rows", () => {
    expect(
      filterAuditRows(rows, {
        id: "a",
      }),
    ).toEqual(rows.slice(0, 2))
  })

  it("paginates with nextCursor", () => {
    const first = paginateAuditRows(rows, { limit: 2 })

    expect(first.records).toEqual(rows.slice(0, 2))
    expect(typeof first.nextCursor).toBe("string")

    const second = paginateAuditRows(rows, {
      limit: 2,
      cursor: first.nextCursor || undefined,
    })

    expect(second.records).toEqual([rows[2]])
    expect(second.nextCursor).toBeNull()
  })
})
