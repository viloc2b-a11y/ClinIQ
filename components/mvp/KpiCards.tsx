"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatUsd } from "@/lib/mvp/format"

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}

export function KpiCards({ kpis }: { kpis: { ready: number; atRisk: number; delayed: number; critical: number } }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Ready to Bill" value={formatUsd(kpis.ready)} />
      <KpiCard label="Revenue at Risk" value={formatUsd(kpis.atRisk)} />
      <KpiCard label="Delayed (>7d)" value={String(kpis.delayed)} />
      <KpiCard label="Critical (>30d)" value={String(kpis.critical)} />
    </div>
  )
}

