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
            No leakage rows in this top list — data may still be loading on other modules or execution may be disconnected.
          </p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Visit</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Days Pending</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => {
              const severity = statusFromDays(p.daysPending)
              return (
                <TableRow key={`${p.patient}-${p.visit}`}>
                  <TableCell className="font-medium">{p.patient}</TableCell>
                  <TableCell>{p.visit}</TableCell>
                  <TableCell>{formatUsd(p.amount)}</TableCell>
                  <TableCell className="font-semibold">{p.daysPending}</TableCell>
                  <TableCell>
                    <Badge variant={severity === "critical" ? "destructive" : "secondary"}>{severity}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  )
}

