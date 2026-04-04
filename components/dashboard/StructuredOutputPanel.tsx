"use client"

import type { ArDemoScenarioResult } from "@/lib/cliniq-core/ar/demo-scenario"

import { Badge } from "@/components/ui/badge"
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

export type PlaceholderStructuredOutput = {
  type: string
  status: string
  notes: string
}

type StructuredOutputPanelProps = {
  demoData: ArDemoScenarioResult | null
  structuredOutput: PlaceholderStructuredOutput | null
  onQueueRowClick: (invoiceId: string, recommendedAction: string) => void
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

export function StructuredOutputPanel({
  demoData,
  structuredOutput,
  onQueueRowClick,
}: StructuredOutputPanelProps) {
  const sortedQueue = demoData
    ? [...demoData.queueRows].sort((a, b) => a.priorityRank - b.priorityRank)
    : []
  const topQueue = sortedQueue.slice(0, 10)
  const s = demoData?.commandSummary

  return (
    <div className="flex flex-col gap-6">
      {/* SECTION A — REAL */}
      <Card className="border-emerald-500/35">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">AR operational output</CardTitle>
            <Badge variant="success">REAL — Module 6 + risk + queue + summary</Badge>
          </div>
          <CardDescription>
            From <code className="rounded bg-muted px-1 text-xs">buildArDemoScenario(&quot;2026-06-15&quot;)</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {!demoData ? (
            <p className="text-sm text-muted-foreground">
              Load the AR demo scenario to see live balances, risk, queue, and command
              summary.
            </p>
          ) : (
            <>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Command summary
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Outstanding AR</div>
                    <div className="text-lg font-semibold tabular-nums">
                      {money(s!.totalOutstandingAr)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">High risk</div>
                    <div className="text-lg font-semibold tabular-nums text-red-700 dark:text-red-300">
                      {money(s!.totalHighRiskAr)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Medium risk</div>
                    <div className="text-lg font-semibold tabular-nums text-amber-800 dark:text-amber-200">
                      {money(s!.totalMediumRiskAr)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Action now</div>
                    <div className="text-lg font-semibold tabular-nums">
                      {s!.invoicesRequiringActionNow}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Top priority queue (first 10)
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>invoiceId</TableHead>
                      <TableHead>sponsorId</TableHead>
                      <TableHead className="text-right">open</TableHead>
                      <TableHead className="text-right">dPD</TableHead>
                      <TableHead>risk</TableHead>
                      <TableHead>action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topQueue.map((row) => (
                      <TableRow
                        key={row.invoiceId}
                        className="cursor-pointer"
                        onClick={() =>
                          onQueueRowClick(row.invoiceId, row.recommendedAction)
                        }
                      >
                        <TableCell className="max-w-[140px] truncate font-mono text-xs">
                          {row.invoiceId}
                        </TableCell>
                        <TableCell className="text-xs">{row.sponsorId}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {money(row.openBalance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {row.daysPastDue}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.riskLevel === "high"
                                ? "danger"
                                : row.riskLevel === "medium"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {row.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{row.recommendedAction}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Risk breakdown ($ open by tier)
                </h3>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>
                    <span className="text-muted-foreground">High: </span>
                    <strong className="tabular-nums">{money(s!.totalHighRiskAr)}</strong>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Medium: </span>
                    <strong className="tabular-nums">
                      {money(s!.totalMediumRiskAr)}
                    </strong>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Low: </span>
                    <strong className="tabular-nums">{money(s!.totalLowRiskAr)}</strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SECTION B — PLACEHOLDER */}
      <Card className="border-amber-500/40">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Document output</CardTitle>
            <Badge variant="warning">PLACEHOLDER</Badge>
          </div>
          <CardDescription>
            Document extraction (placeholder) — not connected to AR engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!structuredOutput ? (
            <p className="text-sm text-muted-foreground">
              Process a document to see mock structured JSON here.
            </p>
          ) : (
            <pre className="max-h-[200px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {JSON.stringify(structuredOutput, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
