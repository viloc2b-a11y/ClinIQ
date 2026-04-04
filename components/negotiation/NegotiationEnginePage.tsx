"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { buildHoustonMetabolicNegotiationInput } from "@/features/negotiation/mock-from-budget-gap"
import type { NegotiationEngineInput } from "@/lib/cliniq-core/budget-gap"
import {
  buildNegotiationPackage,
  counterofferLinesToCsv,
  generateEmailDraft,
  NEGOTIATION_ENGINE_INPUT_SESSION_KEY,
  negotiationPackageToJson,
  type NegotiationStrategy,
} from "@/lib/cliniq-core/negotiation"

export default function NegotiationEnginePage() {
  const [engineInput, setEngineInput] = useState<NegotiationEngineInput | null>(
    null,
  )
  const [strategy, setStrategy] = useState<NegotiationStrategy>("balanced")
  const [paste, setPaste] = useState("")
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(NEGOTIATION_ENGINE_INPUT_SESSION_KEY)
    if (!raw) return
    try {
      const d = JSON.parse(raw) as NegotiationEngineInput
      if (d.schemaVersion !== "1.0" || !Array.isArray(d.lines)) {
        sessionStorage.removeItem(NEGOTIATION_ENGINE_INPUT_SESSION_KEY)
        return
      }
      setEngineInput(d)
      setErr(null)
    } catch {
      setErr("invalid handoff payload")
    } finally {
      sessionStorage.removeItem(NEGOTIATION_ENGINE_INPUT_SESSION_KEY)
    }
  }, [])

  const pkg = useMemo(() => {
    if (!engineInput) return null
    return buildNegotiationPackage({ input: engineInput, strategy })
  }, [engineInput, strategy])

  const email = useMemo(() => (pkg ? generateEmailDraft(pkg) : null), [pkg])

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="font-semibold text-lg">Negotiation engine (Module 4)</h1>
      <p className="text-muted-foreground text-sm">
        After a Budget Gap run, choose “Sponsor counteroffer (Module 4)” on the gap page to load{" "}
        <code className="text-xs">NegotiationEngineInput</code> here, or paste JSON / load mock.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setEngineInput(buildHoustonMetabolicNegotiationInput())}>
          Load mock input
        </Button>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as NegotiationStrategy)}
        >
          <option value="conservative">conservative</option>
          <option value="balanced">balanced</option>
          <option value="firm">firm</option>
        </select>
      </div>

      <Textarea
        placeholder="Paste NegotiationEngineInput JSON"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        rows={3}
        className="font-mono text-xs"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!paste.trim()}
        onClick={() => {
          try {
            const d = JSON.parse(paste) as NegotiationEngineInput
            if (d.schemaVersion !== "1.0" || !Array.isArray(d.lines)) throw new Error("bad shape")
            setEngineInput(d)
            setErr(null)
          } catch {
            setErr("invalid json")
            setEngineInput(null)
          }
        }}
      >
        Parse JSON
      </Button>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}

      {pkg && email ? (
        <>
          <Textarea
            readOnly
            value={negotiationPackageToJson(pkg)}
            rows={12}
            className="font-mono text-xs"
          />
          <Textarea readOnly value={email.fullText} rows={10} className="font-mono text-xs" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const a = document.createElement("a")
                a.href = URL.createObjectURL(
                  new Blob(
                    [
                      JSON.stringify(
                        { negotiationPackage: pkg, sponsorEmailDraft: email },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  ),
                )
                a.download = `${pkg.studyId ?? "pkg"}.json`
                a.click()
              }}
            >
              Download JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const a = document.createElement("a")
                a.href = URL.createObjectURL(
                  new Blob([counterofferLinesToCsv(pkg.counterofferLines)], {
                    type: "text/csv",
                  }),
                )
                a.download = `${pkg.studyId ?? "counteroffer"}.csv`
                a.click()
              }}
            >
              Download CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(email.fullText)}
            >
              Copy email
            </Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Load mock or parse JSON to see output.</p>
      )}
    </main>
  )
}
