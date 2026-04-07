import { ClinIQWorkbench } from "@/components/workbench/ClinIQWorkbench"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { study_key?: string }
}) {
  const initialStudyKeyFromUrl = (searchParams?.study_key ?? "STUDY-1").trim()
  return <ClinIQWorkbench initialStudyKeyFromUrl={initialStudyKeyFromUrl} />
}
