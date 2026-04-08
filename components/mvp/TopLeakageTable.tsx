"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatUsd, statusFromDays, type MvpPatient } from "@/lib/mvp/mock"

export function TopLeakageTable({ patients }: { patients: readonly MvpPatient[] }) {
  const sorted = [...patients].sort((a, b) => b.days - a.days)

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>Top Leakage</CardTitle>
      </CardHeader>
      <CardContent>
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
              const severity = statusFromDays(p.days)
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell>{p.visit}</TableCell>
                  <TableCell>{formatUsd(p.amount)}</TableCell>
                  <TableCell className="font-semibold">{p.days}</TableCell>
                  <TableCell>
                    <Badge variant={severity === "critical" ? "destructive" : "secondary"}>{severity}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

