"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { TopLeakageTable } from "@/components/mvp/TopLeakageTable"
import { MVP_MOCK } from "@/lib/mvp/mock"

export function DashboardMvpPage() {
  return (
    <MvpShell title="Dashboard">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />
      <KpiCards kpis={MVP_MOCK.kpis} />
      <TopLeakageTable patients={MVP_MOCK.patients} />
      <div className="flex flex-wrap gap-2">
        <Link href="/counteroffer" className={cn(buttonVariants({ variant: "default", size: "default" }))}>
          Generate Counteroffer
        </Link>
        <Link href="/billables" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
          View Billables
        </Link>
        <Link href="/documents" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
          Review Documents
        </Link>
      </div>
    </MvpShell>
  )
}

