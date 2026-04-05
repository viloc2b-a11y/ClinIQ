import type {
  ActionCenterMutationApiResponse,
  ActionCenterMutationRequest,
} from "@/lib/cliniq-core/action-center/mutation-api-types"

export async function mutateActionCenterClient(body: ActionCenterMutationRequest) {
  const res = await fetch("/api/action-center/mutate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  })

  const json: ActionCenterMutationApiResponse = await res.json()

  if (!res.ok || !json.ok) {
    throw new Error(json.ok ? "failed_to_apply_action" : json.error)
  }

  return json.data
}
