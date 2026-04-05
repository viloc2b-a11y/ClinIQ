import { bootstrapMemoryActionCenter } from "@/lib/cliniq-core/action-center/bootstrap-memory-action-center"
import { mutateActionCenterFromPersistence } from "@/lib/cliniq-core/action-center/mutate-action-center-from-persistence"

/** STEP 4: bootstrap (memory seed when applicable) → persistence-backed mutate; status codes by `error` key. */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    await bootstrapMemoryActionCenter()

    const result = await mutateActionCenterFromPersistence(body)

    if (!result.ok) {
      const status =
        result.error === "invalid_request"
          ? 400
          : result.error === "unsupported_action"
            ? 400
            : result.error === "item_not_found"
              ? 404
              : 500

      return Response.json(result, { status })
    }

    return Response.json(result, { status: 200 })
  } catch {
    return Response.json({ ok: false, error: "invalid_request" }, { status: 400 })
  }
}
