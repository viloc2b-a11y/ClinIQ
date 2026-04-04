import { DashboardClient } from "@/components/dashboard/DashboardClient"
import { buildArDemoScenario } from "@/lib/cliniq-core/ar"

const DEMO_AS_OF = "2026-06-15"

export default function DashboardPage() {
  const initialArDemo = buildArDemoScenario(DEMO_AS_OF)
  return (
    <DashboardClient asOfDate={DEMO_AS_OF} initialArDemo={initialArDemo} />
  )
}
