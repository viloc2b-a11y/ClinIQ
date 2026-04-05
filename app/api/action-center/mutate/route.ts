import { mutateActionCenter } from "@/lib/cliniq-core/action-center/mutate-action-center"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = mutateActionCenter(body)

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
