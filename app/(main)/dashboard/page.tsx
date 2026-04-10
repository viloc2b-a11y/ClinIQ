import { DashboardCommandCenterPage } from "../../../components/mvp/pages/DashboardCommandCenterPage"
import { DashboardMvpPage } from "../../../components/mvp/pages/DashboardMvpPage"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const studyKey = typeof sp.study_key === "string" ? sp.study_key.trim() : ""
  if (studyKey) return <DashboardMvpPage />
  return <DashboardCommandCenterPage />
}
