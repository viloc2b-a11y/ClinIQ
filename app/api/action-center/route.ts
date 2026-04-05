import { getMockServerActionCenterState } from "@/lib/cliniq-core/action-center"

export async function GET() {
  try {
    const data = getMockServerActionCenterState()
    return Response.json({ ok: true, data }, { status: 200 })
  } catch {
    return Response.json({ ok: false, error: "failed_to_build_action_center" }, { status: 500 })
  }
}
