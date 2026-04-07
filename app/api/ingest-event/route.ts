export const dynamic = 'force-dynamic'

import { createClient } from "@supabase/supabase-js"
import { ingestEvent } from "@/lib/cliniq-core/events/ingest-event"
import type { ExpectedBillable } from "@/lib/cliniq-core/post-award-ledger/types"

/**
 * POST /api/ingest-event
 *
 * Auth: Bearer token via Authorization header.
 * Set CLINIQ_API_SECRET in env vars (Dokploy). If unset, route is open (dev only).
 *
 * Body: { event: IngestEventInput, expectedBillables: ExpectedBillable[] }
 */
export async function POST(req: Request) {
  // Auth guard
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

  const b = body as { event?: unknown; expectedBillables?: unknown }
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
    return Response.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
