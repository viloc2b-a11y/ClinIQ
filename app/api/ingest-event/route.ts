export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import { ingestEvent } from "@/lib/cliniq-core/events/ingest-event"
import { loadExpectedBillablesFromDb } from "@/lib/cliniq-core/events/load-expected-billables-from-db"
import type { ExpectedBillable } from "@/lib/cliniq-core/post-award-ledger/types"

function allowBodyExpectedBillables(): boolean {
  return (
    process.env.CLINIQ_INGEST_ALLOW_BODY_EXPECTED_BILLABLES === "1" ||
    process.env.NODE_ENV === "test"
  )
}

/**
 * POST /api/ingest-event
 *
 * Auth: Bearer token via Authorization header.
 * Set CLINIQ_API_SECRET in env vars. If unset, route is open (dev only).
 *
 * Production: body `{ event, siteId }` — expected billables load from DB (published baseline).
 * Test / explicit dev: set CLINIQ_INGEST_ALLOW_BODY_EXPECTED_BILLABLES=1 to send `expectedBillables` in body.
 */
export async function POST(req: Request) {
  const secret = process.env.CLINIQ_API_SECRET
  if (secret) {
    const auth = req.headers.get("authorization") ?? ""
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
    if (token !== secret) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return Response.json(
      { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
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
    siteId?: unknown
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
      { ok: false, error: "Body must include event: { studyId, subjectId, visitName, eventType, eventDate }" },
      { status: 400 },
    )
  }

  const supabase = createClient(url, key)

  let expectedBillables: ExpectedBillable[]

  if (allowBodyExpectedBillables() && Array.isArray(b.expectedBillables)) {
    expectedBillables = b.expectedBillables as ExpectedBillable[]
  } else {
    const siteId = typeof b.siteId === "string" ? b.siteId.trim() : ""
    if (!siteId) {
      return Response.json(
        {
          ok: false,
          error:
            "siteId (uuid) is required unless CLINIQ_INGEST_ALLOW_BODY_EXPECTED_BILLABLES=1 with expectedBillables in body",
        },
        { status: 400 },
      )
    }
    try {
      expectedBillables = await loadExpectedBillablesFromDb(supabase, {
        siteId,
        studyKey: ev.studyId.trim(),
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return Response.json({ ok: false, error: message }, { status: 500 })
    }
    if (expectedBillables.length === 0) {
      return Response.json(
        {
          ok: false,
          error:
            "No published expected_billables for this siteId + studyKey — run POST /api/study/publish first",
        },
        { status: 400 },
      )
    }
  }

  const siteFromBody = typeof b.siteId === "string" ? b.siteId.trim() : ""
  const siteFromEvent = typeof ev.siteId === "string" ? ev.siteId.trim() : ""
  const siteIdForEvent = siteFromBody || siteFromEvent

  try {
    const result = await ingestEvent({
      supabase,
      event: {
        studyId: ev.studyId,
        subjectId: ev.subjectId,
        visitName: ev.visitName,
        eventType: ev.eventType,
        eventDate: ev.eventDate,
        ...(siteIdForEvent ? { siteId: siteIdForEvent } : {}),
      },
      expectedBillables,
    })
    return Response.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
