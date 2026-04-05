import { NextResponse } from "next/server"

import { runPythonLogVisit } from "./python-bridge"

type Body = {
  studyId?: unknown
  subjectId?: unknown
  visitName?: unknown
  completedBy?: unknown
  timestamp?: unknown
  expectedBillables?: unknown
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status })
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad("Invalid JSON body")
  }

  const studyId = typeof body.studyId === "string" ? body.studyId.trim() : ""
  const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : ""
  const visitName = typeof body.visitName === "string" ? body.visitName.trim() : ""

  if (!studyId || !subjectId || !visitName) {
    return bad("studyId, subjectId, and visitName are required")
  }

  const completedBy =
    typeof body.completedBy === "string" && body.completedBy.trim()
      ? body.completedBy.trim()
      : null
  const timestamp =
    typeof body.timestamp === "string" && body.timestamp.trim()
      ? body.timestamp.trim()
      : null

  const expected_billables = Array.isArray(body.expectedBillables)
    ? body.expectedBillables
    : undefined

  const projectRoot = process.cwd()
  const payload = {
    study_id: studyId,
    subject_id: subjectId,
    visit_name: visitName,
    ...(completedBy != null ? { completed_by: completedBy } : {}),
    ...(timestamp != null ? { timestamp } : {}),
    ...(expected_billables !== undefined ? { expected_billables } : {}),
  }

  const result = await runPythonLogVisit(projectRoot, payload)

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        studyId,
        subjectId,
        visitName,
        message: result.error,
        ...(result.detail ? { detail: result.detail } : {}),
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    studyId: result.study_id,
    subjectId: result.subject_id,
    visitName: result.visit_name,
    triggeredCount: result.triggered_count,
    eventsEmitted: result.events_emitted,
    message: result.message,
  })
}
