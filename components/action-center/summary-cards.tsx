import type { ActionCenterSummary } from "@/lib/cliniq-core/action-center"

function formatMoneyUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export function ActionCenterSummaryCards({ summary }: { summary: ActionCenterSummary }) {
  return (
    <div className="space-y-10 sm:space-y-12">
      <section
        className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6"
        aria-label="Summary totals"
      >
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Open Actions
          </p>
          <p className="text-foreground mt-3 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
            {summary.totalOpen}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/25 bg-destructive/[0.06] p-6 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            High Priority
          </p>
          <p className="text-foreground mt-3 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
            {summary.totalHighPriority}
          </p>
        </div>
        <div className="rounded-xl border border-foreground/10 bg-muted/30 p-6 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Missing Revenue
          </p>
          <p className="text-foreground mt-3 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
            {formatMoneyUsd(summary.totalMissingAmount)}
          </p>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
        aria-label="Breakdowns"
      >
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-foreground text-sm font-semibold tracking-tight">By owner role</h2>
          <ul className="text-foreground mt-4 list-none space-y-2 font-mono text-sm leading-relaxed">
            {Object.keys(summary.byOwnerRole)
              .sort((a, b) => a.localeCompare(b))
              .map((key) => (
                <li key={key}>
                  <span className="text-muted-foreground">- </span>
                  {key}: {summary.byOwnerRole[key]}
                </li>
              ))}
            {Object.keys(summary.byOwnerRole).length === 0 && (
              <li className="text-muted-foreground">No data</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-foreground text-sm font-semibold tracking-tight">By action type</h2>
          <ul className="text-foreground mt-4 list-none space-y-2 font-mono text-sm leading-relaxed">
            {Object.keys(summary.byActionType)
              .sort((a, b) => a.localeCompare(b))
              .map((key) => (
                <li key={key}>
                  <span className="text-muted-foreground">- </span>
                  {key}: {summary.byActionType[key]}
                </li>
              ))}
            {Object.keys(summary.byActionType).length === 0 && (
              <li className="text-muted-foreground">No data</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}
