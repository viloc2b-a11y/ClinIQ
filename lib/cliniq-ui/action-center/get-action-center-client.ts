import type { ActionCenterApiResponse, ActionCenterResult } from "@/lib/cliniq-core/action-center"

export async function getActionCenterClient(): Promise<ActionCenterResult> {
  const res = await fetch("/api/action-center", {
    method: "GET",
    cache: "no-store",
  })

  const json = (await res.json()) as ActionCenterApiResponse

  if (!res.ok) {
    const msg = json.ok === false ? json.error : `Request failed (${res.status})`
    throw new Error(msg)
  }

  if (!json.ok) {
    throw new Error(json.error)
  }

  return json.data
}
