import { ActionCenterSummaryCards } from "@/components/action-center/summary-cards"
import type { ActionCenterSummary } from "@/lib/cliniq-core/action-center"

export function ActionCenterSummary({ summary }: { summary: ActionCenterSummary }) {
  return <ActionCenterSummaryCards summary={summary} />
}
