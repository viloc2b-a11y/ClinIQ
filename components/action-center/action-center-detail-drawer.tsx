"use client"

import {
  OwnerRoleBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/action-center/action-center-badges"
import { Button } from "@/components/ui/button"
import { buildActionCenterDetailView } from "@/lib/cliniq-core/action-center"
import type { ActionCenterRowAction } from "@/lib/cliniq-core/action-center/row-actions"
import type { ActionCenterItem } from "@/lib/cliniq-core/action-center/types"
import { handleRowAction } from "@/lib/cliniq-ui/action-center/handle-row-action"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export interface ActionCenterDetailDrawerProps {
  item: ActionCenterItem | null
  open: boolean
  onClose: () => void
  onAction?: (action: ActionCenterRowAction, item: ActionCenterItem) => void | Promise<void>
}

function formatMoneyUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function MissingAmountHighlight({ amount }: { amount: number }) {
  return (
    <div className="border-destructive/25 bg-destructive/[0.08] rounded-lg border px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Missing amount</p>
      <p className="text-destructive mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
        {formatMoneyUsd(amount)}
      </p>
    </div>
  )
}

export function ActionCenterDetailDrawer({ item, open, onClose, onAction }: ActionCenterDetailDrawerProps) {
  useEffect(() => {
    if (!open || !item) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, item])

  useEffect(() => {
    if (!open || !item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, item, onClose])

  if (!item) return null
  if (!open) return null

  const detail = buildActionCenterDetailView(item)
  const { facts } = detail

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-center-detail-title"
    >
      <button
        type="button"
        aria-label="Close detail panel"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity dark:bg-black/55"
        onClick={onClose}
      />
      <aside
        className={cn(
          "border-border bg-background relative ml-auto flex h-full w-full max-w-full flex-col border-l shadow-xl",
          "md:max-w-md lg:max-w-lg",
        )}
      >
        <div
          className={cn(
            "border-border flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-5",
            "bg-background/95 supports-[backdrop-filter]:backdrop-blur-sm sticky top-0 z-10",
          )}
        >
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Action detail
            </p>
            <h2
              id="action-center-detail-title"
              className="text-foreground mt-1 text-lg font-semibold leading-snug tracking-tight"
            >
              {item.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <PriorityBadge priority={item.priority} />
              <StatusBadge status={item.status} />
              <OwnerRoleBadge role={item.ownerRole} />
            </div>
          </div>
          <Button type="button" variant="default" size="default" onClick={onClose} className="shrink-0">
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <section aria-label="Money summary" className="space-y-4">
            <MissingAmountHighlight amount={facts.missingAmount} />
            <dl className="text-muted-foreground grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs sm:text-sm">
              <dt>Expected</dt>
              <dd className="text-foreground text-right tabular-nums">{formatMoneyUsd(facts.expectedAmount)}</dd>
              <dt>Invoiced</dt>
              <dd className="text-foreground text-right tabular-nums">{formatMoneyUsd(facts.invoicedAmount)}</dd>
            </dl>
          </section>

          <section className="mt-8" aria-label="Core facts">
            <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wide uppercase">Details</h3>
            <div className="border-border bg-card/40 rounded-xl border p-4">
              <dl className="grid grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Study</dt>
                <dd className="text-foreground font-mono text-xs leading-snug break-all">{facts.studyId}</dd>
                <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Subject</dt>
                <dd className="text-foreground font-mono text-xs leading-snug break-all">{facts.subjectId}</dd>
                <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Visit</dt>
                <dd className="text-foreground leading-snug">{facts.visitName}</dd>
                <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Line code</dt>
                <dd className="text-foreground font-mono text-xs leading-snug">{facts.lineCode}</dd>
                <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Leakage status</dt>
                <dd className="text-foreground leading-snug">{facts.leakageStatus}</dd>
                <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Leakage reason</dt>
                <dd className="text-foreground leading-snug">{facts.leakageReason}</dd>
                {facts.invoicePeriodStart && facts.invoicePeriodEnd ? (
                  <>
                    <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Invoice period</dt>
                    <dd className="text-foreground font-mono text-xs leading-snug">
                      {facts.invoicePeriodStart} — {facts.invoicePeriodEnd}
                    </dd>
                  </>
                ) : null}
                {facts.eventLogId ? (
                  <>
                    <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Event log ID</dt>
                    <dd className="text-foreground font-mono text-xs leading-snug break-all">{facts.eventLogId}</dd>
                  </>
                ) : null}
                {facts.billableInstanceId ? (
                  <>
                    <dt className="text-muted-foreground pt-0.5 text-xs leading-snug">Billable instance ID</dt>
                    <dd className="text-foreground font-mono text-xs leading-snug break-all">
                      {facts.billableInstanceId}
                    </dd>
                  </>
                ) : null}
              </dl>
            </div>
          </section>

          <section className="mt-8" aria-label="Description">
            <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wide uppercase">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
          </section>

          <section className="mt-10" aria-label="Allowed next actions">
            <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wide uppercase">Next actions</h3>
            <ul className="flex flex-col gap-2">
              {detail.rowActions.map((a) => (
                <li key={a.key}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-auto min-h-9 w-full justify-start whitespace-normal py-2.5 text-left",
                      !a.enabled && "text-muted-foreground border-dashed bg-muted/25 opacity-80",
                    )}
                    disabled={!a.enabled}
                    title={a.reasonIfDisabled}
                    onClick={() =>
                      onAction ? onAction(a.key, item) : handleRowAction({ action: a.key, item })
                    }
                  >
                    <span className="flex w-full min-w-0 flex-col gap-0.5">
                      <span>{a.label}</span>
                      {!a.enabled ? (
                        <span className="text-muted-foreground/90 font-normal text-[0.65rem] tracking-wide uppercase">
                          Unavailable
                        </span>
                      ) : null}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  )
}
