"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CLINIQ_BUDGET_GAP_HANDOFF_KEY } from "@/lib/budget-gap/handoff-session"
import type { ParsedBudgetLine } from "@/lib/import/parsed-budget-line"
import type { InternalBudgetLine, SponsorBudgetLine, BudgetStudyMeta } from "@/lib/cliniq-core/budget-gap"
import { houstonKatyInternalBudgetLines, houstonKatySponsorBudgetLines } from "@/features/budget-gap/mock-houston-diabetes"

export function ImportNoAuthDemoClient() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [intent, setIntent] = useState<"sponsor_budget" | "site_internal_budget" | "contract_financial">("contract_financial")
  const [studyKey, setStudyKey] = useState("STUDY-1")
  const [studyName, setStudyName] = useState("STUDY-1 Demo Study")
  const [sponsorName, setSponsorName] = useState("Acme Pharma")
  const [croName, setCroName] = useState("Northbridge CRO")

  const toSponsorLine = (l: ParsedBudgetLine, i: number): SponsorBudgetLine => {
    const qty = l.quantity ?? 1
    const unit = l.unitType ?? "unit"
    const unitOffer =
      l.unitPrice ??
      (l.totalPrice != null && qty ? l.totalPrice / qty : null) ??
      0
    const total = l.totalPrice ?? unitOffer * qty
    return {
      id: l.lineId || `sponsor-${i}`,
      category: l.category ?? "other",
      lineCode: (l.lineId || `LINE-${i}`).slice(0, 32),
      label: l.itemDescription || "Imported line",
      visitName: l.visitName ?? "General",
      quantity: qty,
      unit,
      sponsorUnitOffer: Number(unitOffer) || 0,
      sponsorTotalOffer: Number(total) || 0,
      notes: l.notes ?? "",
      source: "sponsor-budget",
    }
  }

  const toInternalLine = (l: ParsedBudgetLine, i: number): InternalBudgetLine => {
    const qty = l.quantity ?? 1
    const unit = l.unitType ?? "unit"
    const unitCost =
      l.unitPrice ??
      (l.totalPrice != null && qty ? l.totalPrice / qty : null) ??
      0
    const total = l.totalPrice ?? unitCost * qty
    return {
      id: l.lineId || `internal-${i}`,
      category: l.category ?? "other",
      lineCode: (l.lineId || `LINE-${i}`).slice(0, 32),
      label: l.itemDescription || "Imported line",
      visitName: l.visitName ?? "General",
      quantity: qty,
      unit,
      internalUnitCost: Number(unitCost) || 0,
      internalTotal: Number(total) || 0,
      notes: l.notes ?? "",
      source: "internal-model",
    }
  }

  const seed = async () => {
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch("/api/demo/noauth-seed", { method: "POST" })
      const json = (await res.json()) as { ok?: boolean; error?: string; seeded?: { session_id: string } }
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Seed failed")
      setMsg(`Seeded intake session ${json.seeded?.session_id ?? ""}`.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const uploadAndParse = async () => {
    if (!file) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.set("file", file)
      fd.set("importIntent", intent)
      fd.set("studyKey", studyKey.trim() || "STUDY-1")
      if (studyName.trim()) fd.set("studyName", studyName.trim())
      if (sponsorName.trim()) fd.set("sponsorName", sponsorName.trim())
      if (croName.trim()) fd.set("croName", croName.trim())

      const res = await fetch("/api/demo/import-session", { method: "POST", body: fd })
      const json = (await res.json()) as {
        ok?: boolean
        error?: string
        sessionId?: string
        lineCount?: number
        lines?: ParsedBudgetLine[]
      }
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Upload failed")
      const parsedLines = Array.isArray(json.lines) ? json.lines : []

      // Build the handoff payload expected by Budget Gap.
      const studyMeta: BudgetStudyMeta = {
        studyId: studyKey.trim() || "STUDY-1",
        studyName: studyName.trim() || "Imported budget",
        patientsInBudget: 1,
      }

      let sponsorLines: SponsorBudgetLine[] = []
      let internalLines: InternalBudgetLine[] = []

      if (intent === "sponsor_budget") {
        sponsorLines = parsedLines.map(toSponsorLine)
        internalLines = houstonKatyInternalBudgetLines
      } else if (intent === "site_internal_budget") {
        internalLines = parsedLines.map(toInternalLine)
        sponsorLines = houstonKatySponsorBudgetLines
      } else {
        // Contract/financial sources are usually sponsor-side terms; treat as sponsor input by default.
        sponsorLines = parsedLines.map(toSponsorLine)
        internalLines = houstonKatyInternalBudgetLines
      }

      sessionStorage.setItem(
        CLINIQ_BUDGET_GAP_HANDOFF_KEY,
        JSON.stringify({ studyMeta, internalLines, sponsorLines }),
      )

      setMsg(`Parsed ${json.lineCount ?? 0} lines — opening Budget Gap…`.trim())
      router.push("/budget-gap")
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Import intake (demo)</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No credentials required. This seeds a real import session + lines so the portfolio dashboard can surface
          Sponsor/CRO context.
        </p>
      </header>

      {err ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {msg}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload &amp; parse (no login)</CardTitle>
          <CardDescription>Creates real `cliniq_import_sessions` + `cliniq_import_lines` under a demo site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Study key</div>
              <input
                value={studyKey}
                onChange={(e) => setStudyKey(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Import intent</div>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as any)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="contract_financial">Contract / financial source</option>
                <option value="sponsor_budget">Sponsor budget</option>
                <option value="site_internal_budget">Site / internal budget</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs font-medium text-muted-foreground">Study name</div>
              <input
                value={studyName}
                onChange={(e) => setStudyName(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Sponsor</div>
              <input
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">CRO</div>
              <input
                value={croName}
                onChange={(e) => setCroName(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1"
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || !file} onClick={() => void uploadAndParse()}>
              {busy ? "Parsing…" : "Upload & parse"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void seed()}>
              {busy ? "Seeding…" : "Seed intake"}
            </Button>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
              Open dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

