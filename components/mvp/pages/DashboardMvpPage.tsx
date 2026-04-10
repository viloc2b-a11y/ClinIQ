"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { TopLeakageTable, type TopLeakageRow } from "@/components/mvp/TopLeakageTable"
import { getExecutionSummary, getLeakageRows } from "@/lib/mvp/backend"

export function DashboardMvpPage() {
  const { isDemoMode, studyKey, enterDemoMode } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<{ ready: number; atRisk: number; delayed: number; critical: number }>({
    ready: 0,
    atRisk: 0,
    delayed: 0,
    critical: 0,
  })
  const [leakageRows, setLeakageRows] = useState<TopLeakageRow[]>([])
  const [sourceNote, setSourceNote] = useState<string | null>(null)
  const [sourceError, setSourceError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [summaryRes, leakageRes] = await Promise.all([
        getExecutionSummary(studyKey, { demoMode: isDemoMode }),
        getLeakageRows(studyKey, { demoMode: isDemoMode }),
      ])
      if (cancelled) return

      setKpis(summaryRes.value)
      setLeakageRows(leakageRes.value.slice(0, 20))

      if (summaryRes.source === "error" || leakageRes.source === "error") {
        setSourceError(summaryRes.error ?? leakageRes.error ?? "Could not load dashboard data.")
        setSourceNote(null)
      } else {
        setSourceError(null)
        if (summaryRes.source === "live" || leakageRes.source === "live") {
          setSourceNote(null)
        } else {
          setSourceNote(summaryRes.note ?? leakageRes.note ?? "Coordinated demo data — connect execution to go live.")
        }
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [studyKey])

  return (
    <MvpShell
      title="Execution dashboard"
      subtitle="Downstream execution tracking after agreement close — billables and leakage for the active study."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {sourceError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {sourceError}
            </p>
          ) : null}
          {!studyKey.trim() && !isDemoMode ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No study selected.</p>
              <p className="mt-1">Start from Negotiations, or run a demo scenario to preview execution.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Go to Negotiation Hub
                </Link>
                <button
                  type="button"
                  onClick={enterDemoMode}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  Run demo
                </button>
              </div>
            </div>
          ) : sourceNote ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {sourceNote}
            </p>
          ) : null}
          <KpiCards kpis={kpis} />
          <TopLeakageTable rows={leakageRows} />
          <div className="flex flex-wrap gap-2">
            <Link href="/billables" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              Pending billables
            </Link>
            <Link href="/leakage" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              Revenue leakage
            </Link>
            <Link href="/counteroffer" className={cn(buttonVariants({ variant: "default", size: "default" }))}>
              Negotiation opportunity
            </Link>
            <Link href="/analytics" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              Executive analytics
            </Link>
          </div>
        </>
      )}
    </MvpShell>
  )
}

