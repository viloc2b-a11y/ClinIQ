import { createClient } from "@supabase/supabase-js"

import { ingestEvent } from "@/lib/cliniq-core/events/ingest-event"
import type { ExpectedBillable } from "@/lib/cliniq-core/post-award-ledger/types"

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return Response.json(
      {
        ok: false,
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const b = body as {
    event?: unknown
    expectedBillables?: unknown
  }

  const ev = b.event as Record<string, unknown> | undefined
  if (
    !ev ||
    typeof ev.studyId !== "string" ||
    typeof ev.subjectId !== "string" ||
    typeof ev.visitName !== "string" ||
    typeof ev.eventType !== "string" ||
    typeof ev.eventDate !== "string"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          "Body must include event: { studyId, subjectId, visitName, eventType, eventDate }",
      },
      { status: 400 },
    )
  }

  if (!Array.isArray(b.expectedBillables)) {
    return Response.json(
      { ok: false, error: "Body must include expectedBillables: ExpectedBillable[]" },
      { status: 400 },
    )
  }

  const supabase = createClient(url, key)

  try {
    const result = await ingestEvent({
      supabase,
      event: {
        studyId: ev.studyId,
        subjectId: ev.subjectId,
        visitName: ev.visitName,
        eventType: ev.eventType,
        eventDate: ev.eventDate,
      },
      expectedBillables: b.expectedBillables as ExpectedBillable[],
    })
    // v1: top-level ok: true when ingest resolves; Action Center issues are in result.actionCenterSync?.ok
    return Response.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
