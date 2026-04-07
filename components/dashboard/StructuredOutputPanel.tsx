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

type StructuredOutputPanelProps = {
  asOfDate: string
  demoData: ArDemoScenarioResult | null
  onQueueRowClick: (invoiceId: string, recommendedAction: string) => void
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

function formatAsOfLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(d)
}

export function StructuredOutputPanel({
  asOfDate,
  demoData,
  onQueueRowClick,
}: StructuredOutputPanelProps) {
  const sortedQueue = demoData
    ? [...demoData.queueRows].sort((a, b) => a.priorityRank - b.priorityRank)
    : []
  const topQueue = sortedQueue.slice(0, 10)
  const s = demoData?.commandSummary

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Collections & risk</CardTitle>
            <Badge variant="secondary">Demo data</Badge>
          </div>
          <CardDescription>
            Sample receivables portfolio as of {formatAsOfLabel(asOfDate)}. You can reload the
            demo from the left panel anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {!demoData ? (
            <p className="text-sm text-muted-foreground">
              Load the demo to see outstanding balances, risk tiers, and the priority
              collections queue.
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
                      <TableHead>Invoice</TableHead>
                      <TableHead>Sponsor</TableHead>
                      <TableHead className="text-right">Open balance</TableHead>
                      <TableHead className="text-right">Days past due</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Recommended action</TableHead>
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
    </div>
  )
}
