import { describe, expect, it, vi } from "vitest"

vi.mock("./python-bridge", () => ({
  runPythonLogVisit: vi.fn(),
}))

import { runPythonLogVisit } from "./python-bridge"
import { POST } from "./route"

describe("POST /api/visits/log", () => {
  it("rejects missing required fields", async () => {
    const res = await POST(
      new Request("http://localhost/api/visits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId: "S" }),
      }),
    )
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.ok).toBe(false)
    expect(j.message).toMatch(/required/i)
  })

  it("accepts valid visit payload and maps to Python", async () => {
    vi.mocked(runPythonLogVisit).mockResolvedValue({
      ok: true,
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Screening Visit",
      triggered_count: 0,
      events_emitted: 1,
      message: "Visit logged successfully",
    })

    const res = await POST(
      new Request("http://localhost/api/visits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyId: "S-1",
          subjectId: "SUB-001",
          visitName: "Screening Visit",
          completedBy: "coordinator@site.com",
          timestamp: "2026-04-04T10:00:00.000Z",
        }),
      }),
    )

    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j).toMatchObject({
      ok: true,
      studyId: "S-1",
      subjectId: "SUB-001",
      visitName: "Screening Visit",
      message: "Visit logged successfully",
    })

    expect(runPythonLogVisit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        study_id: "S-1",
        subject_id: "SUB-001",
        visit_name: "Screening Visit",
        completed_by: "coordinator@site.com",
        timestamp: "2026-04-04T10:00:00.000Z",
      }),
    )
  })

  it("returns clear error when Python bridge fails", async () => {
    vi.mocked(runPythonLogVisit).mockResolvedValue({
      ok: false,
      error: "Python crashed",
    })

    const res = await POST(
      new Request("http://localhost/api/visits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyId: "S-1",
          subjectId: "SUB-001",
          visitName: "V",
        }),
      }),
    )

    expect(res.status).toBe(502)
    const j = await res.json()
    expect(j.ok).toBe(false)
    expect(j.message).toBe("Python crashed")
  })
})
