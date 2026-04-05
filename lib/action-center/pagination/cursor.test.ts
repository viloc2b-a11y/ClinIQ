import { describe, expect, it } from "vitest"

import { decodeActionCenterCursor, encodeActionCenterCursor } from "./cursor"

describe("action center cursor", () => {
  it("encodes and decodes cursor payload", () => {
    const cursor = encodeActionCenterCursor({
      createdAt: "2026-04-05T00:00:00.000Z",
      id: "action_item::A",
    })

    expect(decodeActionCenterCursor(cursor)).toEqual({
      createdAt: "2026-04-05T00:00:00.000Z",
      id: "action_item::A",
    })
  })

  it("returns null for invalid cursor", () => {
    expect(decodeActionCenterCursor("not-valid")).toBeNull()
  })
})
