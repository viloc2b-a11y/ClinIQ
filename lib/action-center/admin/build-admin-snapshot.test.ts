import { describe, expect, it } from "vitest"

import { buildActionCenterAdminSnapshot } from "./build-admin-snapshot"

describe("buildActionCenterAdminSnapshot", () => {
  it("builds deterministic admin snapshot", () => {
    const snapshot = buildActionCenterAdminSnapshot({
      generatedAt: "2026-04-05T00:00:00.000Z",
      records: [
        {
          id: "action_item::A",
          type: "action_item",
          payload: { id: "A" },
          createdAt: "2026-04-05T00:00:00.000Z",
        },
        {
          id: "task::B",
          type: "task",
          payload: { id: "B" },
          createdAt: "2026-04-05T00:00:01.000Z",
        },
      ],
      operations: [
        {
          operationId: "write::2026-04-05T00:00:00.000Z",
          timestamp: "2026-04-05T00:00:00.000Z",
          kind: "write",
          status: "success",
          summary: {
            status: "success",
            ok: true,
            partial: false,
            attempted: 1,
            written: 1,
          },
        },
        {
          operationId: "verify::2026-04-05T00:00:01.000Z",
          timestamp: "2026-04-05T00:00:01.000Z",
          kind: "verify",
          status: "verification_failed",
          summary: {
            status: "verification_failed",
            totalExpected: 2,
            found: 1,
            missing: ["x"],
            matched: ["y"],
            warnings: ["Some expected action items were not found in Action Center."],
            mode: "full",
          },
        },
      ],
      audit: [
        {
          id: "action_item::A",
          step: "write_attempt",
          timestamp: "2026-04-05T00:00:00.000Z",
        },
        {
          id: "action_item::A",
          step: "write_success",
          timestamp: "2026-04-05T00:00:01.000Z",
        },
      ],
      metrics: {
        writesAttempted: 1,
        writesSuccess: 1,
        writesFailed: 0,
      },
    })

    expect(snapshot).toEqual({
      generatedAt: "2026-04-05T00:00:00.000Z",
      records: {
        total: 2,
        byType: {
          action_item: 1,
          task: 1,
        },
      },
      operations: {
        total: 2,
        byKind: {
          write: 1,
          verify: 1,
          write_and_verify: 0,
        },
        byStatus: {
          success: 1,
          partial: 0,
          failed: 0,
          verification_failed: 1,
        },
      },
      audit: {
        total: 2,
        byStep: {
          write_attempt: 1,
          write_success: 1,
          write_fail: 0,
        },
      },
      metrics: {
        writesAttempted: 1,
        writesSuccess: 1,
        writesFailed: 0,
      },
    })
  })
})
