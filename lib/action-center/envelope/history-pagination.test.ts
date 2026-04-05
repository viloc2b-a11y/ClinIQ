import { describe, expect, it } from "vitest"

import {
  decodeOperationHistoryCursor,
  encodeOperationHistoryCursor,
  filterOperationHistoryRows,
  paginateOperationHistoryRows,
  sortOperationHistoryRows,
} from "./history-pagination"
import type { ActionCenterOperationEnvelope } from "./types"

function makeRow(
  operationId: string,
  timestamp: string,
  kind: "write" | "verify" | "write_and_verify",
  status: "success" | "partial" | "failed" | "verification_failed",
): ActionCenterOperationEnvelope {
  if (kind === "write") {
    return {
      operationId,
      timestamp,
      kind,
      status,
      summary: {
        status,
        ok: status === "success",
        partial: status === "partial",
        attempted: 1,
        written: status === "failed" ? 0 : 1,
      },
    }
  }

  if (kind === "verify") {
    return {
      operationId,
      timestamp,
      kind,
      status,
      summary: {
        status,
        totalExpected: 1,
        found: status === "success" ? 1 : 0,
        missing: status === "success" ? [] : ["x"],
        matched: status === "success" ? ["x"] : [],
        warnings:
          status === "success"
            ? []
            : ["Some expected action items were not found in Action Center."],
        mode: "full",
      },
    }
  }

  return {
    operationId,
    timestamp,
    kind,
    status,
    summary: {
      status,
      ok: status === "success",
      write: {
        status: status === "verification_failed" ? "success" : status,
        ok: status !== "failed",
        partial: status === "partial",
        attempted: 1,
        written: status === "failed" ? 0 : 1,
      },
      verify: {
        status: status === "verification_failed" ? "verification_failed" : "success",
        totalExpected: 1,
        found: status === "verification_failed" ? 0 : 1,
        missing: status === "verification_failed" ? ["x"] : [],
        matched: status === "verification_failed" ? [] : ["x"],
        warnings:
          status === "verification_failed"
            ? ["Some expected action items were not found in Action Center."]
            : [],
        mode: "full",
      },
    },
  }
}

describe("operation history pagination helpers", () => {
  it("encodes and decodes operation history cursor", () => {
    const cursor = encodeOperationHistoryCursor({
      timestamp: "2026-04-05T00:00:00.000Z",
      operationId: "write::2026-04-05T00:00:00.000Z",
    })

    expect(decodeOperationHistoryCursor(cursor)).toEqual({
      timestamp: "2026-04-05T00:00:00.000Z",
      operationId: "write::2026-04-05T00:00:00.000Z",
    })
  })

  it("sorts deterministically", () => {
    const rows = sortOperationHistoryRows([
      makeRow(
        "verify::2026-04-05T00:00:01.000Z",
        "2026-04-05T00:00:01.000Z",
        "verify",
        "success",
      ),
      makeRow(
        "write::2026-04-05T00:00:00.000Z",
        "2026-04-05T00:00:00.000Z",
        "write",
        "success",
      ),
    ])

    expect(rows.map((r) => r.operationId)).toEqual([
      "write::2026-04-05T00:00:00.000Z",
      "verify::2026-04-05T00:00:01.000Z",
    ])
  })

  it("filters by kind and status", () => {
    const rows = filterOperationHistoryRows(
      [
        makeRow(
          "write::2026-04-05T00:00:00.000Z",
          "2026-04-05T00:00:00.000Z",
          "write",
          "success",
        ),
        makeRow(
          "verify::2026-04-05T00:00:01.000Z",
          "2026-04-05T00:00:01.000Z",
          "verify",
          "verification_failed",
        ),
      ],
      {
        kind: "verify",
        status: "verification_failed",
      },
    )

    expect(rows.map((r) => r.operationId)).toEqual(["verify::2026-04-05T00:00:01.000Z"])
  })

  it("paginates with nextCursor", () => {
    const rows = [
      makeRow(
        "write::2026-04-05T00:00:00.000Z",
        "2026-04-05T00:00:00.000Z",
        "write",
        "success",
      ),
      makeRow(
        "verify::2026-04-05T00:00:01.000Z",
        "2026-04-05T00:00:01.000Z",
        "verify",
        "success",
      ),
      makeRow(
        "write_and_verify::2026-04-05T00:00:02.000Z",
        "2026-04-05T00:00:02.000Z",
        "write_and_verify",
        "success",
      ),
    ]

    const first = paginateOperationHistoryRows(rows, { limit: 2 })

    expect(first.records.map((r) => r.operationId)).toEqual([
      "write::2026-04-05T00:00:00.000Z",
      "verify::2026-04-05T00:00:01.000Z",
    ])
    expect(typeof first.nextCursor).toBe("string")

    const second = paginateOperationHistoryRows(rows, {
      limit: 2,
      cursor: first.nextCursor || undefined,
    })

    expect(second.records.map((r) => r.operationId)).toEqual([
      "write_and_verify::2026-04-05T00:00:02.000Z",
    ])
    expect(second.nextCursor).toBeNull()
  })
})
