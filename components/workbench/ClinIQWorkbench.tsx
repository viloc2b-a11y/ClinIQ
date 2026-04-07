"use client"

import {
  DocumentIngestPanel,
  type DocumentTypeOption,
} from "@/components/dashboard/DocumentIngestPanel"
import { DocumentViewer } from "@/components/dashboard/DocumentViewer"
import { OperationalDashboardClient } from "@/components/execution/OperationalDashboardClient"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  LineChart,
  Presentation,
  Receipt,
  Scale,
  Sparkles,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, type ReactNode } from "react"

const LS_STUDY = "cliniq.workbench.studyKey"
const LS_SITE = "cliniq.workbench.siteLabel"
const LS_NOTES = "cliniq.workbench.siteNotes"

type SectionId =
  | "overview"
  | "documents"
  | "site"
  | "execution"
  | "analysis"
  | "negotiation"

const navItems: { id: SectionId; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { id: "documents", label: "Documents", icon: <FileStack className="size-4" /> },
  { id: "site", label: "Site & data", icon: <Building2 className="size-4" /> },
  { id: "execution", label: "Execution", icon: <Workflow className="size-4" /> },
  { id: "analysis", label: "Analysis", icon: <BarChart3 className="size-4" /> },
  { id: "negotiation", label: "Negotiation", icon: <Scale className="size-4" /> },
]

type PlaceholderStructuredOutput = {
  type: DocumentTypeOption
  status: string
  notes: string
}

export function ClinIQWorkbench({
  initialStudyKeyFromUrl,
}: {
  initialStudyKeyFromUrl: string
}) {
  const router = useRouter()
  const [section, setSection] = useState<SectionId>("overview")
  const [studyKey, setStudyKey] = useState(() => initialStudyKeyFromUrl.trim() || "STUDY-1")
  const [siteLabel, setSiteLabel] = useState("")
  const [siteNotes, setSiteNotes] = useState("")
  const [revenue, setRevenue] = useState<
    | {
        openDeals: number
        closedDeals: number
        avgMargin: number
        upsideCaptured: number
      }
    | null
  >(null)
  const [docType, setDocType] = useState<DocumentTypeOption>("budget")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [structuredOutput, setStructuredOutput] = useState<PlaceholderStructuredOutput | null>(
    null,
  )

  useEffect(() => {
    try {
      const urlKey = initialStudyKeyFromUrl.trim() || "STUDY-1"
      const storedKey = localStorage.getItem(LS_STUDY)
      if (storedKey && urlKey === "STUDY-1") setStudyKey(storedKey)
      else setStudyKey(urlKey)
      const sl = localStorage.getItem(LS_SITE)
      const sn = localStorage.getItem(LS_NOTES)
      if (sl) setSiteLabel(sl)
      if (sn) setSiteNotes(sn)
    } catch {
      setStudyKey(initialStudyKeyFromUrl.trim() || "STUDY-1")
    }
  }, [initialStudyKeyFromUrl])

  useEffect(() => {
    try {
      localStorage.setItem(LS_STUDY, studyKey)
      localStorage.setItem(LS_SITE, siteLabel)
      localStorage.setItem(LS_NOTES, siteNotes)
    } catch {
      /* ignore */
    }
  }, [studyKey, siteLabel, siteNotes])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/revenue/dashboard", { credentials: "include" })
        const json = (await res.json()) as unknown
        const okPayload = json as {
          ok?: unknown
          openDeals?: unknown
          closedDeals?: unknown
          avgMargin?: unknown
          upsideCaptured?: unknown
        }
        if (!res.ok || okPayload.ok !== true) return
        setRevenue({
          openDeals: Number(okPayload.openDeals ?? 0) || 0,
          closedDeals: Number(okPayload.closedDeals ?? 0) || 0,
          avgMargin: Number(okPayload.avgMargin ?? 0) || 0,
          upsideCaptured: Number(okPayload.upsideCaptured ?? 0) || 0,
        })
      } catch {
        // ignore
      }
    }
    void run()
  }, [])

  const persistStudyToUrl = useCallback((sk: string) => {
    const u = new URL(window.location.href)
    u.searchParams.set("study_key", sk)
    window.history.replaceState(null, "", u.toString())
  }, [])

  const onSaveSiteContext = () => {
    persistStudyToUrl(studyKey)
  }

  const processDocument = useCallback(() => {
    const name = uploadedFile?.name ?? "no file"
    setExtractedText(
      `Simulated text for [${name}] — local pipeline (no parser at this step).`,
    )
    setStructuredOutput({
      type: docType,
      status: "placeholder",
      notes:
        "For real extraction and AR handoff, use the full Documents + AR flow (button below).",
    })
  }, [uploadedFile, docType])

  const clearDocument = useCallback(() => {
    setExtractedText(null)
    setStructuredOutput(null)
  }, [])

  const dataLinks = [
    {
      label: "Expected billables (JSON)",
      href: `/api/execution/expected-billables?study_id=${encodeURIComponent(studyKey)}`,
    },
    {
      label: "Event log (JSON)",
      href: `/api/execution/event-log?study_id=${encodeURIComponent(studyKey)}`,
    },
    {
      label: "Billable instances (JSON)",
      href: `/api/execution/billable-instances?study_key=${encodeURIComponent(studyKey)}`,
    },
    {
      label: "Execution summary (JSON)",
      href: `/api/execution/summary?study_key=${encodeURIComponent(studyKey)}`,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50/80 via-background to-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">ClinIQ — Workbench</h1>
              <p className="text-xs text-muted-foreground">
                Documents · site · execution · analysis · negotiation
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Study: {studyKey}
            </Badge>
            <Link
              href="/import"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-1.5")}
            >
              Import
            </Link>
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-1.5")}
            >
              Admin
            </Link>
            <Link
              href="/sales"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-1.5")}
            >
              <Presentation className="size-3.5" />
              Product tour
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-0 md:flex-row md:gap-6 md:px-6 md:py-6">
        <aside className="border-b border-border bg-card/50 md:w-52 md:shrink-0 md:border-b-0 md:border-r md:bg-transparent md:pr-2 md:pt-0">
          <nav
            className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-0"
            aria-label="Sections"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  section === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 px-4 py-4 pb-12 sm:px-6 md:px-0 md:py-0">
          {section === "overview" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Pick a section on the left. Everything links to real engine screens: budget gap,
                  negotiation, ledger, Action Center, and per-study data APIs.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Revenue (minimal)</CardTitle>
                    <CardDescription>Open vs closed deals and captured upside.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">deals abiertos</div>
                        <div className="text-lg font-semibold">{revenue?.openDeals ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">deals cerrados</div>
                        <div className="text-lg font-semibold">{revenue?.closedDeals ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">margen promedio</div>
                        <div className="font-mono text-sm">
                          {revenue ? `${(revenue.avgMargin * 100).toFixed(1)}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">upside capturado</div>
                        <div className="text-sm font-semibold">
                          {revenue ? `$${Math.round(revenue.upsideCaptured).toLocaleString()}` : "—"}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/negotiation"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
                    >
                      Open negotiation
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Documents</CardTitle>
                    <CardDescription>
                      Upload files (local placeholder) or open the full flow with the AR demo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => setSection("documents")}>
                      Go to documents
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Site & data</CardTitle>
                    <CardDescription>
                      Study key, site label, and quick read-only JSON via API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => setSection("site")}>
                      Set context
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Live execution</CardTitle>
                    <CardDescription>
                      Expected vs actual, leakage, recent events, and Action Center sync.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" className="w-full" onClick={() => setSection("execution")}>
                      Open execution
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Analysis</CardTitle>
                    <CardDescription>Budget gap, claims, ledger, and operations queue.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Link
                      href="/budget-gap"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
                    >
                      Budget gap
                    </Link>
                    <Link
                      href="/action-center"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
                    >
                      Action Center
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Negotiation</CardTitle>
                    <CardDescription>Counteroffer flow and Module 4 package.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => setSection("negotiation")}>
                      Go to negotiation
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Collections (demo)</CardTitle>
                    <CardDescription>AR aging, risk, and collections queue.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/dashboard/ar"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "inline-flex w-full justify-center gap-1.5",
                      )}
                    >
                      <Receipt className="size-3.5" />
                      Documents + AR
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          {section === "documents" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Prepare budgets, contracts, and protocol inputs for the pipeline. The left panel is
                  local validation; the full review + AR flow is in the card below.
                </p>
              </div>
              <Card className="border-primary/20 bg-primary/[0.03]">
                <CardHeader>
                  <CardTitle className="text-base">Full flow (recommended)</CardTitle>
                  <CardDescription>
                    Same experience as before: document ingest (placeholder) + real AR engine and
                    exports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button onClick={() => router.push("/dashboard/ar")}>Open documents + AR</Button>
                  <Link
                    href="/budget-gap"
                    className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
                  >
                    Budget gap (upload / compare)
                  </Link>
                </CardContent>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                <DocumentIngestPanel
                  documentType={docType}
                  onDocumentTypeChange={setDocType}
                  uploadedFileName={uploadedFile?.name ?? null}
                  onFileSelected={setUploadedFile}
                  onProcessDocument={processDocument}
                  onClearDocument={() => {
                    setUploadedFile(null)
                    clearDocument()
                  }}
                  onLoadArDemo={() => router.push("/dashboard/ar")}
                />
                <DocumentViewer
                  uploadedFileName={uploadedFile?.name ?? null}
                  documentType={docType}
                  extractedText={extractedText}
                />
              </div>
              {structuredOutput ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Structured output (placeholder)</CardTitle>
                    <CardDescription>{structuredOutput.notes}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs">
                      {JSON.stringify(structuredOutput, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {section === "site" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Site & data</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Set study and site context. The study key drives APIs and the execution panel. To
                  edit rows in the database, use Supabase Studio or future admin screens.
                </p>
              </div>
              <Card className="max-w-xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">Operational context</CardTitle>
                  <CardDescription>Stored in this browser (localStorage).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Study key (text, e.g. STUDY-1)
                    </label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={studyKey}
                      onChange={(e) => setStudyKey(e.target.value.trim() || "STUDY-1")}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Site name or label (optional)
                    </label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={siteLabel}
                      onChange={(e) => setSiteLabel(e.target.value)}
                      placeholder="e.g. Houston Metabolic — Site 101"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Internal notes (optional)
                    </label>
                    <Textarea
                      value={siteNotes}
                      onChange={(e) => setSiteNotes(e.target.value)}
                      rows={4}
                      placeholder="CRA contact, billing notes, etc."
                      className="text-sm"
                    />
                  </div>
                  <Button type="button" onClick={onSaveSiteContext}>
                    Save and sync URL
                  </Button>
                </CardContent>
              </Card>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Read-only data</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Requires Supabase server env on the deploy. Opens in a new tab.
                </p>
                <ul className="flex flex-col gap-2">
                  {dataLinks.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {l.label}
                      </a>
                      <code className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                        {l.href}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {section === "execution" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Execution</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Panel wired to <code className="rounded bg-muted px-1">/api/execution/run</code> for
                  study <span className="font-mono">{studyKey}</span>. Change the key under Site &
                  data or in the panel form.
                </p>
              </div>
              <OperationalDashboardClient
                key={studyKey}
                initialStudyKey={studyKey}
              />
            </div>
          ) : null}

          {section === "analysis" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Analysis</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Clinical–financial engine tools: gaps, claims, ledger, and leakage via Action
                  Center.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border/80">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                      <BarChart3 className="size-5" />
                    </div>
                    <CardTitle className="text-base">Budget gap</CardTitle>
                    <CardDescription>
                      Compare internal vs sponsor budget, export, and generate counteroffer copy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/budget-gap" className={cn(buttonVariants(), "w-full justify-center")}>
                      Open budget gap
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border/80">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                      <ClipboardList className="size-5" />
                    </div>
                    <CardTitle className="text-base">Action Center</CardTitle>
                    <CardDescription>Work queue and operational leakage.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/action-center"
                      className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
                    >
                      Open Action Center
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border/80">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                      <FileStack className="size-5" />
                    </div>
                    <CardTitle className="text-base">Claims</CardTitle>
                    <CardDescription>Invoice package and claims line.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/claims"
                      className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
                    >
                      Open claims
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border/80">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                      <LineChart className="size-5" />
                    </div>
                    <CardTitle className="text-base">Ledger</CardTitle>
                    <CardDescription>Post-award ledger and traceability.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/ledger"
                      className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
                    >
                      Open ledger
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          {section === "negotiation" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Negotiation & counteroffer</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  From Budget Gap, hand off to Module 4 or paste JSON. Generate package, CSV, and
                  email draft.
                </p>
              </div>
              <Card className="border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">Recommended flow</CardTitle>
                  <CardDescription>
                    1) Budget gap → negotiation action · 2) Module 4 → strategy and export
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Link href="/budget-gap" className={cn(buttonVariants(), "inline-flex")}>
                    Go to budget gap
                  </Link>
                  <Link
                    href="/negotiation"
                    className={cn(buttonVariants({ variant: "secondary" }), "inline-flex")}
                  >
                    Open negotiation engine
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
