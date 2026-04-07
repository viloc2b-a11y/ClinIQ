import { ClinIQPresentation } from "@/components/marketing/ClinIQPresentation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ClinIQ — Product tour",
  description:
    "Product map, demo script, and technical reference for sponsors and site leadership.",
}

export default function SalesPage() {
  return <ClinIQPresentation variant="tour" />
}
