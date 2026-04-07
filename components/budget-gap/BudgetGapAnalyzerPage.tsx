"use client"

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileDown,
  FileJson,
  FileText,
  Loader2,
  ShieldAlert,
  TrendingDown,
  Upload,
} from "lucide-react"
import { CLINIQ_BUDGET_GAP_HANDOFF_KEY } from "@/lib/budget-gap/handoff-session"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  houstonKatyDiabetesStudyMeta,
  houstonKatyInternalBudgetLines,
  houstonKatySponsorBudgetLines,
} from "@/features/budget-gap/mock-houston-diabetes"
import {
  budgetGapResultToNegotiationEngineInput,
  buildBudgetGapAnalysisExport,
  buildNegotiationPackage as buildBudgetGapNegotiationPackage,
  compareSponsorBudgetToInternalBudget,
  gapLinesToCsv,
  generateCounterofferText,
  type BudgetDecision,
  type BudgetGapLine,
  type BudgetGapSummary,
  type BudgetStudyMeta,
  type CompareBudgetInput,
  type CompareBudgetResult,
  type GapStatus,
  type InternalBudgetLine,
  type MissingInvoiceable,
  type NegotiationEngineInput,
  type SponsorBudgetLine,
} from "@/lib/cliniq-core/budget-gap"
import { NEGOTIATION_ENGINE_INPUT_SESSION_KEY } from "@/lib/cliniq-core/negotiation/client"
import { cn } from "@/lib/utils"

type AnalysisPhase = "idle" | "analyzing" | "ready" | "error"

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function statusBadgeVariant(
  status: GapStatus,
): "danger" | "warning" | "success" | "destructive" {
  switch (status) {
    case "loss":
    case "undervalued":
      return "danger"
    case "breakeven":
      return "warning"
    case "profitable":
    case "present":
      return "success"
    case "missing":
      return "destructive"
    case "internal_only":
    case "pricing_rule_only":
      return "warning"
    default:
      return "warning"
  }
}

function gapTone(gap: number): string {
  if (gap < -0.01) return "text-red-600 dark:text-red-400"
  if (gap > 0.01) return "text-emerald-600 dark:text-emerald-400"
  return "text-amber-700 dark:text-amber-300"
}

function decisionBadgeVariant(
  decision: BudgetDecision,
): "danger" | "warning" | "success" {
  switch (decision) {
    case "reject":
      return "danger"
    case "negotiate":
      return "warning"
    case "accept":
      return "success"
    default:
      return "warning"
  }
}

function decisionCardRing(decision: BudgetDecision): string {
  switch (decision) {
    case "reject":
      return "border-red-500/40"
    case "negotiate":
      return "border-amber-500/40"
    case "accept":
      return "border-emerald-500/40"
    default:
      return "border-border"
  }
}

function decisionSummaryCopy(decision: BudgetDecision): string {
  switch (decision) {
    case "reject":
      return "Economics or risk flags fall outside site guardrails. Do not activate without a revised sponsor budget."
    case "negotiate":
      return "Recoverable shortfall or thin margin—use targeted line increases and the draft below to align finance and delivery."
    case "accept":
      return "Blended margin clears the 10% accept band on this snapshot. Confirm contract language, then proceed."
    default:
      return ""
  }
}

type PastedPayload = {
  studyMeta?: BudgetStudyMeta
  internalLines?: InternalBudgetLine[]
  sponsorLines?: SponsorBudgetLine[]
}

function parsePastedBudget(raw: string): PastedPayload {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error("Paste JSON or load the mock scenario.")
  const data = JSON.parse(trimmed) as PastedPayload
  if (!Array.isArray(data.internalLines) || !Array.isArray(data.sponsorLines)) {
    throw new Error("JSON must include internalLines and sponsorLines arrays.")
  }
  return data
}

function downloadTextFile(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: mime })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function BudgetGapAnalyzerPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<AnalysisPhase>("idle")
  const [paste, setPaste] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareBudgetResult | null>(null)
  const [lastStudyMeta, setLastStudyMeta] = useState<BudgetStudyMeta | null>(
    null,
  )
  const [lastCompareInput, setLastCompareInput] =
    useState<CompareBudgetInput | null>(null)
  const [counterofferDraft, setCounterofferDraft] = useState<string | null>(
    null,
  )

  const runCompare = useCallback(
    (
      internalLines: InternalBudgetLine[],
      sponsorLines: SponsorBudgetLine[],
      studyMeta: BudgetStudyMeta,
    ) => {
      const next = compareSponsorBudgetToInternalBudget({
        internalLines,
        sponsorLines,
        studyMeta,
      })
      setLastCompareInput({ internalLines, sponsorLines, studyMeta })
      setLastStudyMeta(studyMeta)
      setCounterofferDraft(null)
      setResult(next)
      setPhase("ready")
    },
    [],
  )

  const simulateAnalyze = useCallback(
    (
      internalLines: InternalBudgetLine[],
      sponsorLines: SponsorBudgetLine[],
      studyMeta: BudgetStudyMeta,
    ) => {
      setPhase("analyzing")
      setParseError(null)
      window.setTimeout(() => {
        runCompare(internalLines, sponsorLines, studyMeta)
      }, 720)
    },
    [runCompare],
  )

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CLINIQ_BUDGET_GAP_HANDOFF_KEY)
      if (!raw) return
      sessionStorage.removeItem(CLINIQ_BUDGET_GAP_HANDOFF_KEY)
      const data = JSON.parse(raw) as PastedPayload
      const internalLines = Array.isArray(data.internalLines) ? data.internalLines : []
      const sponsorLines = Array.isArray(data.sponsorLines) ? data.sponsorLines : []
      const studyMeta: BudgetStudyMeta = data.studyMeta ?? {
        studyId: "imported",
        studyName: "Imported budget",
        patientsInBudget: 1,
      }
      simulateAnalyze(internalLines, sponsorLines, studyMeta)
    } catch {
      /* ignore bad handoff */
    }
  }, [simulateAnalyze])

  const onLoadMock = () => {
    setPaste("")
    simulateAnalyze(
      houstonKatyInternalBudgetLines,
      houstonKatySponsorBudgetLines,
      houstonKatyDiabetesStudyMeta,
    )
  }

  const onRunFromPaste = () => {
    try {
      const payload = parsePastedBudget(paste)
      simulateAnalyze(
        payload.internalLines ?? [],
        payload.sponsorLines ?? [],
        payload.studyMeta ?? {},
      )
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON.")
      setPhase("error")
    }
  }

  const onFile = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    setPaste(text)
    try {
      const payload = parsePastedBudget(text)
      simulateAnalyze(
        payload.internalLines ?? [],
        payload.sponsorLines ?? [],
        payload.studyMeta ?? {},
      )
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON.")
      setPhase("error")
    }
  }

  const summary = result?.summary
  const blendedMargin = useMemo(() => {
    if (!summary || summary.totalInternalRevenue <= 0) return null
    return summary.totalGap / summary.totalInternalRevenue
  }, [summary])

  const negotiationPayload = useMemo((): NegotiationEngineInput | null => {
    if (!result || lastStudyMeta === null) return null
    return budgetGapResultToNegotiationEngineInput(result, lastStudyMeta)
  }, [result, lastStudyMeta])

  const budgetGapNegotiationPackage = useMemo(() => {
    if (!negotiationPayload) return null
    return buildBudgetGapNegotiationPackage(negotiationPayload)
  }, [negotiationPayload])

  const openModule4Negotiation = useCallback(() => {
    if (!negotiationPayload) return
    try {
      sessionStorage.setItem(
        NEGOTIATION_ENGINE_INPUT_SESSION_KEY,
        JSON.stringify(negotiationPayload),
      )
      router.push("/negotiation")
    } catch {
      // storage quota / private mode
    }
  }, [negotiationPayload, router])

  const exportCsv = useCallback(() => {
    if (!result) return
    const slug =
      lastStudyMeta?.studyId?.replace(/[^\w.-]+/g, "-") ?? "budget-gap"
    const csv = gapLinesToCsv(result.gapLines)
    downloadTextFile(`${slug}-gap-lines.csv`, csv, "text/csv;charset=utf-8")
  }, [result, lastStudyMeta?.studyId])

  const exportAnalysisJson = useCallback(() => {
    if (!result || !lastStudyMeta) return
    const slug =
      lastStudyMeta.studyId?.replace(/[^\w.-]+/g, "-") ?? "budget-gap"
    const payload = buildBudgetGapAnalysisExport(
      result,
      lastStudyMeta,
      lastCompareInput ?? undefined,
    )
    downloadTextFile(
      `${slug}-analysis.json`,
      `${JSON.stringify(payload, null, 2)}\n`,
      "application/json;charset=utf-8",
    )
  }, [result, lastStudyMeta, lastCompareInput])

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Module 3 · Budget gap
        </p>
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
          Budget Gap Analyzer
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
          Compare sponsor offers to your internal protocol budget. Highlights
          leakage, missing critical invoiceables, and study-level exposure — all
          computed locally from your inputs.
        </p>
      </header>

      {/* A. Upload / paste */}
      <Card>
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="size-4 opacity-70" aria-hidden />
            Sponsor budget input
          </CardTitle>
          <CardDescription>
            Load the Houston/Katy mock or paste JSON matching{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
              internalLines
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
              sponsorLines
            </code>
            , optional{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
              studyMeta
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="secondary" onClick={onLoadMock}>
              <FileJson className="size-4" aria-hidden />
              Load mock scenario (Houston/Katy)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden />
              Upload JSON
            </Button>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="budget-paste"
              className="flex items-center gap-2 font-medium text-foreground text-xs"
            >
              <ClipboardPaste className="size-3.5 opacity-70" aria-hidden />
              Or paste JSON
            </label>
            <Textarea
              id="budget-paste"
              placeholder='{ "studyMeta": {...}, "internalLines": [...], "sponsorLines": [...] }'
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={5}
              className="font-mono text-xs md:text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={onRunFromPaste}
                disabled={!paste.trim()}
              >
                Run analysis from paste
              </Button>
            </div>
            {parseError ? (
              <p className="text-destructive text-sm" role="alert">
                {parseError}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* B. Analysis progress */}
      {phase === "analyzing" ? (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
            <div>
              <p className="font-medium text-sm">Running comparison…</p>
              <p className="text-muted-foreground text-xs">
                Matching rows, allocating sponsor pools, building summary.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === "idle" && !result ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Load mock data or paste JSON to see the dashboard.
          </CardContent>
        </Card>
      ) : null}

      {result && summary ? (
        <>
          {/* C. Reality Check summary */}
          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-foreground text-sm">
                Reality check
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={exportCsv}
                >
                  <FileDown className="size-3.5" aria-hidden />
                  Export gap CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={exportAnalysisJson}
                >
                  <FileDown className="size-3.5" aria-hidden />
                  Export analysis JSON
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Internal (true cost)"
                value={formatUsd(summary.totalInternalRevenue)}
                icon={<TrendingDown className="size-4" />}
                tone="neutral"
              />
              <SummaryTile
                label="Sponsor offer (matched)"
                value={formatUsd(summary.totalSponsorRevenue)}
                icon={<CheckCircle2 className="size-4" />}
                tone="neutral"
              />
              <SummaryTile
                label="Net gap"
                value={formatUsd(summary.totalGap)}
                sub={
                  blendedMargin !== null
                    ? `${formatPct(blendedMargin)} blended margin`
                    : undefined
                }
                icon={<ShieldAlert className="size-4" />}
                tone={summary.totalGap < 0 ? "bad" : summary.totalGap > 0 ? "good" : "warn"}
              />
              <SummaryTile
                label="Gap / patient"
                value={
                  summary.totalGapPerPatient !== null
                    ? formatUsd(summary.totalGapPerPatient)
                    : "—"
                }
                sub={
                  lastStudyMeta?.patientsInBudget
                    ? `${lastStudyMeta.patientsInBudget} pts in budget meta`
                    : undefined
                }
                icon={<AlertTriangle className="size-4" />}
                tone={
                  summary.totalGapPerPatient !== null && summary.totalGapPerPatient < 0
                    ? "bad"
                    : "neutral"
                }
              />
            </div>
          </section>

          {/* Decision & Action */}
          {negotiationPayload ? (
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground text-sm">
                Decision &amp; action
              </h2>
              <Card
                className={cn("gap-0 py-0 shadow-sm", decisionCardRing(negotiationPayload.decision))}
              >
                <CardHeader className="border-border border-b px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        Site decision
                        <Badge
                          variant={decisionBadgeVariant(
                            negotiationPayload.decision,
                          )}
                          className="uppercase tracking-wide"
                        >
                          {negotiationPayload.decision}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {decisionSummaryCopy(negotiationPayload.decision)}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={openModule4Negotiation}
                      >
                        <ArrowRight className="size-4" aria-hidden />
                        Sponsor counteroffer (Module 4)
                      </Button>
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() =>
                          setCounterofferDraft(
                            generateCounterofferText(negotiationPayload),
                          )
                        }
                      >
                        <FileText className="size-4" aria-hidden />
                        Generate counteroffer draft
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 py-4">
                  {budgetGapNegotiationPackage ? (
                    <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground text-xs leading-relaxed">
                      <span className="font-medium text-foreground">
                        Negotiation package preview:
                      </span>{" "}
                      must-fix{" "}
                      {
                        budgetGapNegotiationPackage.internalView.strategy
                          .mustFix.length
                      }
                      , should-improve{" "}
                      {
                        budgetGapNegotiationPackage.internalView.strategy
                          .shouldImprove.length
                      }
                      , full-accept recovery{" "}
                      {formatUsd(
                        budgetGapNegotiationPackage.internalView.scenarios[0]
                          ?.recoveredRevenue ?? 0,
                      )}
                    </p>
                  ) : null}
                  <div>
                    <p className="mb-2 font-medium text-foreground text-xs">
                      Top negotiation targets (missing invoiceables + deepest
                      losses)
                    </p>
                    {negotiationPayload.topNegotiationTargets.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        No prioritized targets on this run.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Line</TableHead>
                              <TableHead className="text-right">
                                Increase to modeled
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {negotiationPayload.topNegotiationTargets.map(
                              (t) => {
                                const inc =
                                  t.kind === "missing"
                                    ? t.internalTotal
                                    : Math.max(
                                        0,
                                        t.internalTotal - t.sponsorTotalOffer,
                                      )
                                return (
                                  <TableRow key={t.id}>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          t.kind === "missing"
                                            ? "destructive"
                                            : "danger"
                                        }
                                        className="capitalize"
                                      >
                                        {t.kind}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[min(100vw-8rem,28rem)]">
                                      <div className="font-medium text-foreground text-xs">
                                        {t.label}
                                      </div>
                                      <div className="text-[0.65rem] text-muted-foreground leading-snug">
                                        {t.lineCode} · {t.visitName} —{" "}
                                        {t.reason}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                      {formatUsd(inc)}
                                    </TableCell>
                                  </TableRow>
                                )
                              },
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 font-medium text-foreground text-xs">
                      Justification (engine)
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs leading-relaxed">
                      {negotiationPayload.justificationPoints.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  {counterofferDraft ? (
                    <div className="space-y-2">
                      <p className="font-medium text-foreground text-xs">
                        Sponsor-facing draft
                      </p>
                      <Textarea
                        readOnly
                        value={counterofferDraft}
                        rows={14}
                        className="font-mono text-xs md:text-sm"
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {/* D. Comparison table */}
          <Card>
            <CardHeader className="border-border border-b pb-4">
              <CardTitle className="text-base">Line-by-line comparison</CardTitle>
              <CardDescription>
                Internal model vs sponsor offer, keyed by category + visit +
                label.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <GapTable lines={result.gapLines} />
            </CardContent>
          </Card>

          {/* E. Missing revenue */}
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground text-sm">
              Missing revenue (critical invoiceables)
            </h2>
            {result.missingInvoiceables.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No critical sponsor omissions detected on compared lines.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {result.missingInvoiceables.map((m) => (
                  <MissingCard key={m.id} item={m} />
                ))}
              </div>
            )}
          </section>

          {/* F. Impact scorecard */}
          <ImpactScorecard summary={summary} />
        </>
      ) : null}
    </div>
  )
}

function SummaryTile(props: {
  label: string
  value: string
  sub?: string
  icon: ReactNode
  tone: "neutral" | "good" | "bad" | "warn"
}) {
  const { label, value, sub, icon, tone } = props
  const ring =
    tone === "bad"
      ? "border-red-500/35"
      : tone === "good"
        ? "border-emerald-500/35"
        : tone === "warn"
          ? "border-amber-500/35"
          : "border-border"
  return (
    <Card className={cn("gap-2 py-3 shadow-none", ring)}>
      <CardHeader className="px-4 pb-0">
        <CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
          <span className="text-foreground opacity-80">{icon}</span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <p
          className={cn(
            "font-semibold text-xl tracking-tight",
            tone === "bad" && "text-red-600 dark:text-red-400",
            tone === "good" && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {value}
        </p>
        {sub ? (
          <p className="mt-1 text-muted-foreground text-xs">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function GapTable({ lines }: { lines: BudgetGapLine[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Line</TableHead>
          <TableHead>Visit</TableHead>
          <TableHead className="text-right">Internal</TableHead>
          <TableHead className="text-right">Sponsor</TableHead>
          <TableHead className="text-right">Gap</TableHead>
          <TableHead className="text-right">%</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="max-w-[200px]">
              <div className="font-medium text-foreground text-xs">
                {row.label}
              </div>
              <div className="text-[0.65rem] text-muted-foreground">
                {row.category} · {row.lineCode}
              </div>
            </TableCell>
            <TableCell className="text-xs">{row.visitName}</TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatUsd(row.internalTotal)}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatUsd(row.sponsorTotalOffer)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-mono text-xs font-medium",
                gapTone(row.gapAmount),
              )}
            >
              {formatUsd(row.gapAmount)}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatPct(row.gapPercent)}
            </TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(row.status)}>
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function MissingCard({ item }: { item: MissingInvoiceable }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-destructive text-sm">{item.label}</CardTitle>
        <CardDescription className="text-xs">
          {item.visitName} · {item.category}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-muted-foreground leading-relaxed">{item.notes}</p>
        <p className="font-mono font-medium text-foreground">
          At-risk internal total: {formatUsd(item.internalTotal)}
        </p>
      </CardContent>
    </Card>
  )
}

function ImpactScorecard({ summary }: { summary: BudgetGapSummary }) {
  return (
    <Card>
      <CardHeader className="border-border border-b pb-4">
        <CardTitle className="text-base">Impact scorecard</CardTitle>
        <CardDescription>
          Study-level view using meta you attach to the run.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Projected study gap</p>
          <p className="font-semibold text-lg">
            {summary.projectedStudyGap !== null
              ? formatUsd(summary.projectedStudyGap)
              : "Add patientsInBudget + plannedEnrollment"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">
            Revenue target @ 20% margin on internal
          </p>
          <p className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">
            {formatUsd(summary.recommendedRevenueTargetAt20Margin)}
          </p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-muted-foreground text-xs">Negative cash-flow risk</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={summary.negativeCashFlowRisk ? "danger" : "success"}>
              {summary.negativeCashFlowRisk ? "Elevated" : "Lower (this scope)"}
            </Badge>
            <span className="text-muted-foreground text-xs">
              Based on net gap, missing critical lines, and underwater line mix.
            </span>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="font-medium text-foreground text-xs">Primary alerts</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs leading-relaxed">
            {summary.primaryAlerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
