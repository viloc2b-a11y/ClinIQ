import { describe, expect, it } from "vitest"

import { getWriteAndVerifyStatus, getVerifyStatus, getWriteStatus } from "./status"

describe("action center summary status", () => {
  it("returns success for full successful write", () => {
    expect(
      getWriteStatus({
        ok: true,
        partial: false,
        attempted: 2,
        written: 2,
      }),
    ).toBe("success")
  })

  it("returns partial for partial write", () => {
    expect(
      getWriteStatus({
        ok: false,
        partial: true,
        attempted: 2,
        written: 1,
      }),
    ).toBe("partial")
  })

  it("returns failed for zero write", () => {
    expect(
      getWriteStatus({
        ok: false,
        partial: false,
        attempted: 2,
        written: 0,
      }),
    ).toBe("failed")
  })

  it("returns verification_failed when missing ids exist", () => {
    expect(
      getVerifyStatus({
        missing: ["x"],
      }),
    ).toBe("verification_failed")
  })

  it("returns success when verification is clean", () => {
    expect(
      getVerifyStatus({
        missing: [],
      }),
    ).toBe("success")
  })

  it("prioritizes failed over verification_failed", () => {
    expect(
      getWriteAndVerifyStatus({
        write: { status: "failed" },
        verify: { status: "verification_failed" },
      }),
    ).toBe("failed")
  })

  it("returns verification_failed when write succeeds but verify misses", () => {
    expect(
      getWriteAndVerifyStatus({
        write: { status: "success" },
        verify: { status: "verification_failed" },
      }),
    ).toBe("verification_failed")
  })

  it("returns success when both succeed", () => {
    expect(
      getWriteAndVerifyStatus({
        write: { status: "success" },
        verify: { status: "success" },
      }),
    ).toBe("success")
  })
})
