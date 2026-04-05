import { describe, expect, it } from "vitest"

import {
  buildVerifyOperationEnvelope,
  buildWriteAndVerifyOperationEnvelope,
  buildWriteOperationEnvelope,
} from "./build-operation-envelope"

describe("action center operation envelope builders", () => {
  it("builds write envelope", () => {
    const envelope = buildWriteOperationEnvelope(
      {
        status: "success",
        ok: true,
        partial: false,
        attempted: 1,
        written: 1,
      },
      "2026-04-05T00:00:00.000Z",
    )

    expect(envelope).toEqual({
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
    })
  })

  it("builds verify envelope", () => {
    const envelope = buildVerifyOperationEnvelope(
      {
        status: "verification_failed",
        totalExpected: 2,
        found: 1,
        missing: ["b"],
        matched: ["a"],
        warnings: ["Some expected action items were not found in Action Center."],
        mode: "full",
      },
      "2026-04-05T00:00:00.000Z",
    )

    expect(envelope.kind).toBe("verify")
    expect(envelope.status).toBe("verification_failed")
    expect(envelope.operationId).toBe("verify::2026-04-05T00:00:00.000Z")
  })

  it("builds write_and_verify envelope", () => {
    const envelope = buildWriteAndVerifyOperationEnvelope(
      {
        status: "success",
        ok: true,
        write: {
          status: "success",
          ok: true,
          partial: false,
          attempted: 1,
          written: 1,
        },
        verify: {
          status: "success",
          totalExpected: 1,
          found: 1,
          missing: [],
          matched: ["action_item::A"],
          warnings: [],
          mode: "full",
        },
      },
      "2026-04-05T00:00:00.000Z",
    )

    expect(envelope.kind).toBe("write_and_verify")
    expect(envelope.status).toBe("success")
    expect(envelope.operationId).toBe("write_and_verify::2026-04-05T00:00:00.000Z")
  })
})
