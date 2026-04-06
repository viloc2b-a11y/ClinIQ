import { describe, expect, it } from "vitest"

import { runOperationalExecution } from "./run-operational-execution"

describe("runOperationalExecution", () => {
  it("returns ok false when study_key is empty (no client calls)", async () => {
    const r = await runOperationalExecution({} as never, "   ")
    expect(r.ok).toBe(false)
    expect(r.error).toBe("study_key is required")
  })
})
