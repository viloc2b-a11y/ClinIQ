import { OperationalDashboardClient } from "@/components/execution/OperationalDashboardClient"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { study_key?: string }
}) {
  const initialStudyKey = (searchParams?.study_key ?? "STUDY-1").trim()
  return <OperationalDashboardClient initialStudyKey={initialStudyKey} />
}
