"use client"

import { CLINIQ_BUDGET_GAP_HANDOFF_KEY } from "@/lib/budget-gap/handoff-session"
import { IMPORT_INTENT_LABELS, type ImportIntent, type ParsedBudgetLine } from "@/lib/import/parsed-budget-line"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type SiteOption = { id: string; name: string; role: string }

type LineRow = {
  id: string
  sort_order: number
  excluded: boolean
  payload: ParsedBudgetLine
}

export function ImportPageClient() {
  const router = useRouter()
  const [sites, setSites] = useState<SiteOption[]>([])
  const [siteId, setSiteId] = useState("")
  const [studyKey, setStudyKey] = useState("STUDY-1")
  const [studyName, setStudyName] = useState("")
  const [intent, setIntent] = useState<ImportIntent>("sponsor_budget")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [parserWarnings, setParserWarnings] = useState<string[]>([])
  const [rows, setRows] = useState<LineRow[]>([])
  const [newSiteName, setNewSiteName] = useState("")

  const loadSites = useCallback(async () => {
    const res = await fetch("/api/import/sites", { credentials: "include" })
    const json = (await res.json()) as { ok?: boolean; sites?: SiteOption[] }
    if (res.ok && json.sites) {
      setSites(json.sites)
      setSiteId((prev) => prev || (json.sites![0]?.id ?? ""))
    }
  }, [])

  useEffect(() => {
    void loadSites()
  }, [loadSites])

  const onUpload = async () => {
    if (!file) {
      setErr("Choose a file first.")
      return
    }
    setErr(null)
    setBusy(true)
    setParserWarnings([])
    try {
      const fd = new FormData()
      fd.set("file", file)
      fd.set("importIntent", intent)
      fd.set("studyKey", studyKey.trim() || "STUDY-1")
      if (studyName.trim()) fd.set("studyName", studyName.trim())
      if (siteId) fd.set("siteId", siteId)

      const res = await fetch("/api/import/session", {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      const json = (await res.json()) as {
        ok?: boolean
        error?: string
        sessionId?: string
        parserWarnings?: string[]
      }
      if (!res.ok || !json.ok || !json.sessionId) {
        setErr(json.error ?? "Upload failed")
        setParserWarnings(json.parserWarnings ?? [])
        return
      }
      setSessionId(json.sessionId)
      setParserWarnings(json.parserWarnings ?? [])
      const sid = (json as { siteId?: string }).siteId
      if (sid) setSiteId(sid)
      await loadSession(json.sessionId)
    } finally {
      setBusy(false)
    }
  }

  const loadSession = async (sid: string) => {
    const res = await fetch(`/api/import/session/${sid}`, { credentials: "include" })
    const json = (await res.json()) as { ok?: boolean; lines?: LineRow[]; error?: string }
    if (!res.ok || !json.ok) {
      setErr(json.error ?? "Failed to load session")
      return
    }
    setRows(json.lines ?? [])
  }

  const saveReview = async (): Promise<boolean> => {
    if (!sessionId) return false
    setErr(null)
    setBusy(true)
    try {
      const body = {
        replaceAll: true as const,
        rows: rows.map((r) => ({ payload: r.payload, excluded: r.excluded })),
      }
      const res = await fetch(`/api/import/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Save failed")
        return false
      }
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed")
      return false
    } finally {
      setBusy(false)
    }
  }

  const addLine = () => {
    const line: ParsedBudgetLine = {
      lineId: `manual-${crypto.randomUUID()}`,
      sourceType: "excel",
      category: null,
      itemDescription: "",
      unitType: "unit",
      quantity: 1,
      unitPrice: null,
      totalPrice: null,
      visitName: null,
      notes: null,
      confidence: "low",
      warnings: ["Manually added row."],
    }
    setRows((prev) => [
      ...prev,
      {
        id: `local-${line.lineId}`,
        sort_order: prev.length,
        excluded: false,
        payload: line,
      },
    ])
  }

  const updatePayload = (index: number, patch: Partial<ParsedBudgetLine>) => {
    setRows((prev) => {
      const next = [...prev]
      const row = next[index]
      if (!row) return prev
      next[index] = {
        ...row,
        payload: { ...row.payload, ...patch },
      }
      return next
    })
  }

  const toggleExcluded = (index: number) => {
    setRows((prev) => {
      const next = [...prev]
      const row = next[index]
      if (!row) return prev
      next[index] = { ...row, excluded: !row.excluded }
      return next
    })
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const confirmImport = async () => {
    if (!sessionId) return
    setErr(null)
    setBusy(true)
    try {
      const saved = await saveReview()
      if (!saved) return
      const res = await fetch(`/api/import/session/${sessionId}/confirm`, {
        method: "POST",
        credentials: "include",
      })
      const json = (await res.json()) as {
        ok?: boolean
        error?: string
        draftId?: string
      }
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Confirm failed")
        return
      }

      const draftRes = await fetch(`/api/import/draft/${json.draftId}`, {
        credentials: "include",
      })
      const draftJson = (await draftRes.json()) as {
        ok?: boolean
        draft?: {
          internal_lines?: unknown[]
          sponsor_lines?: unknown[]
          study_key?: string
          study_name?: string | null
        }
      }
      if (!draftRes.ok || !draftJson.ok || !draftJson.draft) {
        setErr("Could not load draft for handoff")
        return
      }

      const d = draftJson.draft
      const internalLines = d.internal_lines ?? []
      const sponsorLines = d.sponsor_lines ?? []
      const studyMeta = {
        studyId: d.study_key ?? studyKey,
        studyName: (d.study_name ?? studyName) || undefined,
        siteName: sites.find((s) => s.id === siteId)?.name,
      }

      sessionStorage.setItem(
        CLINIQ_BUDGET_GAP_HANDOFF_KEY,
        JSON.stringify({ studyMeta, internalLines, sponsorLines }),
      )
      router.push("/budget-gap")
    } finally {
      setBusy(false)
    }
  }

  const createSite = async () => {
    setErr(null)
    const res = await fetch("/api/import/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newSiteName || "New site" }),
    })
    const json = (await res.json()) as { ok?: boolean; site?: { id: string }; error?: string }
    if (!res.ok || !json.ok || !json.site) {
      setErr(json.error ?? "Could not create site")
      return
    }
    setNewSiteName("")
    await loadSites()
    setSiteId(json.site.id)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Multiformat import
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Import budget / contract</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Upload Excel, PDF, or Word. Parsing is best-effort by format; you must review and correct
          lines before analysis. Nothing is finalized until you confirm.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Context</CardTitle>
          <CardDescription>Site, study, and what this file represents.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <div className="min-w-[200px] flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Site</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              {sites.length === 0 ? (
                <option value="">No sites — create one below</option>
              ) : (
                sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))
              )}
            </select>
            <div className="flex gap-2">
              <input
                placeholder="New site name"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                className={cn(
                  "h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm",
                )}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => void createSite()}>
                Create site
              </Button>
            </div>
          </div>
          <div className="min-w-[140px] flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Study key</label>
            <input
              value={studyKey}
              onChange={(e) => setStudyKey(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="min-w-[180px] flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Study name (optional)</label>
            <input
              value={studyName}
              onChange={(e) => setStudyName(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="min-w-[220px] flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Import intent</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={intent}
              onChange={(e) => setIntent(e.target.value as ImportIntent)}
            >
              {(Object.keys(IMPORT_INTENT_LABELS) as ImportIntent[]).map((k) => (
                <option key={k} value={k}>
                  {IMPORT_INTENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload</CardTitle>
          <CardDescription>.xlsx / .xls, .pdf, .docx (legacy .doc may require conversion)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            type="file"
            accept=".xlsx,.xls,.pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1"
          />
          <Button type="button" disabled={busy || !file} onClick={() => void onUpload()}>
            {busy ? "Uploading…" : "Upload & parse"}
          </Button>
        </CardContent>
      </Card>

      {parserWarnings.length > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/[0.04]">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Parser warnings</CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {parserWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}

      {sessionId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review lines</CardTitle>
            <CardDescription>
              Edit fields, exclude rows, or add lines. Save, then confirm to create a draft and open
              Budget Gap.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void saveReview()}>
                Save review
              </Button>
              <Button type="button" size="sm" onClick={addLine}>
                Add line
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy || rows.filter((r) => !r.excluded).length === 0}
                onClick={() => void confirmImport()}
              >
                Confirm &amp; open Budget Gap
              </Button>
              <Link
                href="/budget-gap"
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Skip to Budget Gap
              </Link>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="p-2">Include</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Visit</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit $</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Confidence</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className={row.excluded ? "opacity-40" : ""}>
                      <td className="p-1 align-top">
                        <input
                          type="checkbox"
                          checked={!row.excluded}
                          onChange={() => toggleExcluded(i)}
                          aria-label="Include line"
                        />
                      </td>
                      <td className="p-1 align-top">
                        <input
                          value={row.payload.itemDescription}
                          onChange={(e) => updatePayload(i, { itemDescription: e.target.value })}
                          className="h-8 w-full min-w-[140px] rounded border border-input bg-background px-2 text-xs"
                        />
                      </td>
                      <td className="p-1 align-top">
                        <input
                          value={row.payload.visitName ?? ""}
                          onChange={(e) =>
                            updatePayload(i, { visitName: e.target.value || null })
                          }
                          className="h-8 w-full min-w-[80px] rounded border border-input bg-background px-2 text-xs"
                        />
                      </td>
                      <td className="p-1 align-top">
                        <input
                          type="number"
                          value={row.payload.quantity ?? ""}
                          onChange={(e) =>
                            updatePayload(i, {
                              quantity: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="h-8 w-20 rounded border border-input bg-background px-2 text-xs"
                        />
                      </td>
                      <td className="p-1 align-top">
                        <input
                          type="number"
                          value={row.payload.unitPrice ?? ""}
                          onChange={(e) =>
                            updatePayload(i, {
                              unitPrice: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="h-8 w-24 rounded border border-input bg-background px-2 text-xs"
                        />
                      </td>
                      <td className="p-1 align-top">
                        <input
                          type="number"
                          value={row.payload.totalPrice ?? ""}
                          onChange={(e) =>
                            updatePayload(i, {
                              totalPrice: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="h-8 w-24 rounded border border-input bg-background px-2 text-xs"
                        />
                      </td>
                      <td className="p-2 align-top text-muted-foreground">{row.payload.confidence}</td>
                      <td className="p-1 align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive"
                          onClick={() => removeRow(i)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
