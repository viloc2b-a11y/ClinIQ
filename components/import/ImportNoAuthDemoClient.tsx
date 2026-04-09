"use client"

import { useState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ImportNoAuthDemoClient() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const seed = async () => {
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch("/api/demo/noauth-seed", { method: "POST" })
      const json = (await res.json()) as { ok?: boolean; error?: string; seeded?: { session_id: string } }
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Seed failed")
      setMsg(`Seeded intake session ${json.seeded?.session_id ?? ""}`.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Import intake (demo)</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No credentials required. This seeds a real import session + lines so the portfolio dashboard can surface
          Sponsor/CRO context.
        </p>
      </header>

      {err ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {msg}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seed demo intake</CardTitle>
          <CardDescription>Creates `cliniq_import_sessions` + `cliniq_import_lines` under a demo site.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void seed()}>
            {busy ? "Seeding…" : "Seed intake"}
          </Button>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            Open dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

