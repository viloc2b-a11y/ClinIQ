"use client"

import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  claimsMockAsOf,
  claimsOperationalLedgerRows,
} from "@/features/claims/mock-post-award"
import {
  agingReportToCsv,
  buildAgingReport,
  buildClaimItemsFromLedger,
  buildClaimPackage,
  buildInvoicePackage,
  claimItemsToCsv,
  invoicePackageToJson,
} from "@/lib/cliniq-core/claims"
import type { ClaimsLedgerRow } from "@/lib/cliniq-core/claims/types"

function downloadText(filename: string, text: string, mime: string) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([text], { type: mime }))
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function ClaimsInvoicePage() {
  const [rows, setRows] = useState<ClaimsLedgerRow[] | null>(null)

  const claimItems = useMemo(
    () => (rows ? buildClaimItemsFromLedger(rows) : []),
    [rows],
  )
  const claimPackage = useMemo(
    () => (claimItems.length ? buildClaimPackage(claimItems, claimsMockAsOf) : null),
    [claimItems],
  )
  const invoicePackages = useMemo(
    () =>
      claimItems.length
        ? buildInvoicePackage({ claimItems, generatedAt: claimsMockAsOf })
        : [],
    [claimItems],
  )
  const aging = useMemo(
    () =>
      claimItems.length
        ? buildAgingReport({ claimItems, asOf: claimsMockAsOf })
        : [],
    [claimItems],
  )

  const loadMock = useCallback(() => {
    setRows([...claimsOperationalLedgerRows])
  }, [])

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-16 font-mono text-xs sm:px-6">
      <header className="space-y-2 border-b border-border/60 pb-6 font-sans">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Finance · Claims
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Post-award claims</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Claim items from operational ledger rows; invoice packages exclude review-needed lines.
        </p>
      </header>

      <section className="space-y-2 font-sans">
        <h2 className="font-medium text-foreground text-[0.65rem] uppercase tracking-wide">
          A. Load mock data
        </h2>
        <Button type="button" size="sm" onClick={loadMock}>
          Load mock post-award ledger
        </Button>
        {!rows ? (
          <p className="text-muted-foreground text-sm">No data loaded.</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            {rows.length} operational row(s) · as-of {claimsMockAsOf.slice(0, 10)}
          </p>
        )}
      </section>

      {claimPackage ? (
        <>
          <section className="space-y-2">
            <h2 className="font-sans font-medium text-foreground text-[0.65rem] uppercase tracking-wide">
              B. Ready to invoice
            </h2>
            <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 leading-relaxed">
              {JSON.stringify(
                claimPackage.invoiceReadyItems.map((c) => ({
                  lineCode: c.lineCode,
                  label: c.label,
                  amount: c.amount,
                  subjectId: c.subjectId,
                  eventDate: c.eventDate,
                })),
                null,
                2,
              )}
            </pre>
            <p className="font-sans text-muted-foreground text-sm">
              Invoice packages: {invoicePackages.length} · subtotal(s):{" "}
              {invoicePackages.map((p) => p.subtotal).join(", ")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-sans font-medium text-foreground text-[0.65rem] uppercase tracking-wide">
              C. Exceptions requiring review
            </h2>
            <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 leading-relaxed">
              {JSON.stringify(claimPackage.claimExceptions, null, 2)}
            </pre>
          </section>

          <section className="space-y-2">
            <h2 className="font-sans font-medium text-foreground text-[0.65rem] uppercase tracking-wide">
              D. Aging / follow-up
            </h2>
            <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 leading-relaxed">
              {JSON.stringify(aging, null, 2)}
            </pre>
          </section>

          <section className="space-y-2 font-sans">
            <h2 className="font-medium text-foreground text-[0.65rem] uppercase tracking-wide">
              E. Export
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadText(
                    "claim-items.csv",
                    claimItemsToCsv(claimItems),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                Claim items CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadText(
                    "invoice-packages.json",
                    invoicePackageToJson(invoicePackages),
                    "application/json;charset=utf-8",
                  )
                }
              >
                Invoice packages JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadText(
                    "aging-report.csv",
                    agingReportToCsv(aging),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                Aging CSV
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
