import { EventEmitter } from "node:events"
import { describe, expect, it, vi } from "vitest"

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}))

import { spawn } from "node:child_process"

import { runPythonLogVisit } from "./python-bridge"

function mockChild(stdoutJson: string, exitCode = 0) {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }
  }
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.stdin = { write: vi.fn(), end: vi.fn() }
  queueMicrotask(() => {
    child.stdout.emit("data", Buffer.from(`${stdoutJson}\n`, "utf8"))
    child.emit("close", exitCode)
  })
  return child
}

describe("runPythonLogVisit", () => {
  it("writes JSON payload to stdin (snake_case)", async () => {
    const mocked = vi.mocked(spawn)
    mocked.mockImplementation(() =>
      (mockChild(
        JSON.stringify({
          ok: true,
          study_id: "S-1",
          subject_id: "SUB",
          visit_name: "Screening Visit",
          triggered_count: 0,
          events_emitted: 1,
          message: "ok",
        }),
      ) as unknown) as ReturnType<typeof spawn>,
    )

    const out = await runPythonLogVisit("/proj", {
      study_id: "S-1",
      subject_id: "SUB",
      visit_name: "Screening Visit",
      completed_by: "a@b.com",
      timestamp: "2026-04-04T10:00:00.000Z",
    })

    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.study_id).toBe("S-1")
    }
    const child = mocked.mock.results[0]?.value as EventEmitter & {
      stdin: { write: ReturnType<typeof vi.fn> }
    }
    expect(child.stdin.write).toHaveBeenCalledWith(
      JSON.stringify({
        study_id: "S-1",
        subject_id: "SUB",
        visit_name: "Screening Visit",
        completed_by: "a@b.com",
        timestamp: "2026-04-04T10:00:00.000Z",
      }),
    )
  })

  it("returns ok false when Python prints error JSON", async () => {
    vi.mocked(spawn).mockImplementation(() =>
      (mockChild(JSON.stringify({ ok: false, error: "bad" }), 1) as unknown) as ReturnType<
        typeof spawn
      >,
    )

    const out = await runPythonLogVisit("/proj", {
      study_id: "S",
      subject_id: "U",
      visit_name: "V",
    })
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.error).toBe("bad")
    }
  })

  it("returns error when stdout is not valid JSON", async () => {
    vi.mocked(spawn).mockImplementation(
      () => (mockChild("not-json", 0) as unknown) as ReturnType<typeof spawn>,
    )

    const out = await runPythonLogVisit("/proj", {
      study_id: "S",
      subject_id: "U",
      visit_name: "V",
    })
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.error).toContain("not-json")
    }
  })
})
