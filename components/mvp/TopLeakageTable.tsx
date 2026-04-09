"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatUsd, statusFromDays } from "@/lib/mvp/format"

export type TopLeakageRow = {
  patient: string
  visit: string
  amount: number
  daysPending: number
}

export function TopLeakageTable({ rows }: { rows: readonly TopLeakageRow[] }) {
  const sorted = [...rows].sort((a, b) => b.daysPending - a.daysPending)

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>Top Leakage</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items in this list yet — connect execution to populate this view for the active study.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Visit</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Days pending</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => {
                  const severity = statusFromDays(p.daysPending)
                  const severityLabel = severity === "critical" ? "Critical" : "Delayed"
                  return (
                    <TableRow key={`${p.patient}-${p.visit}`}>
                      <TableCell className="font-medium">{p.patient}</TableCell>
                      <TableCell className="whitespace-nowrap">{p.visit}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatUsd(p.amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {p.daysPending}d
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={severity === "critical" ? "destructive" : "secondary"}
                          className="whitespace-nowrap font-medium"
                        >
                          {severityLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

