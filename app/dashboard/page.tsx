import { OperationalDashboardClient } from "@/components/execution/OperationalDashboardClient"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ study_key?: string }>
}) {
  const sp = await searchParams
  const initialStudyKey = (sp.study_key ?? "STUDY-1").trim()
  return <OperationalDashboardClient initialStudyKey={initialStudyKey} />
}
