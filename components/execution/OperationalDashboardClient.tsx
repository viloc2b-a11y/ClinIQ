"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import type { ExecutionState, MissingExecutionLineState } from "@/lib/execution/run-operational-execution"

type RunResponse =
  | { ok: true; data: ExecutionState; error: null }
  | { ok: false; error: string | null; data: ExecutionState | null }

function JsonTable({ rows, keys }: { rows: Record<string, unknown>[]; keys: string[] }) {
  if (rows.length === 0) {
    return <p style={{ color: "#666", fontSize: "0.85rem" }}>No rows</p>
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
      <thead>
        <tr>
          {keys.map((k) => (
            <th key={k} style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "6px" }}>
              {k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {keys.map((k) => (
              <td key={k} style={{ borderBottom: "1px solid #eee", padding: "6px" }}>
                {formatCell(row[k])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function formatCell(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

export function OperationalDashboardClient({ initialStudyKey }: { initialStudyKey: string }) {
  const [studyKey, setStudyKey] = useState(initialStudyKey)
  const [state, setState] = useState<ExecutionState | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const topMissing = (state?.missing ?? []).slice(0, 10)

  const load = useCallback(async (sk: string) => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch(`/api/execution/run?study_key=${encodeURIComponent(sk)}`)
      const json = (await res.json()) as RunResponse
      if (!json.ok || !json.data) {
        setState(null)
        setErr(json.error ?? "Request failed")
        return
      }
      setState(json.data)
    } catch (e) {
      setState(null)
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(initialStudyKey)
  }, [initialStudyKey, load])

  const onSubmitStudy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const sk = String(fd.get("study_key") ?? "").trim()
    if (sk) {
      setStudyKey(sk)
      void load(sk)
      const u = new URL(window.location.href)
      u.searchParams.set("study_key", sk)
      window.history.replaceState(null, "", u.toString())
    }
  }

  const sync = async () => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch("/api/execution/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_key: studyKey, sync_action_center: true }),
      })
      const json = (await res.json()) as RunResponse
      if (!json.ok) {
        setErr(json.error ?? "Sync failed")
        if (json.data) setState(json.data)
        return
      }
      setState(json.data)
      setMsg(`Synced ${json.data.actionCenterSync.upserted} action item(s).`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Operational dashboard</h1>
      <p style={{ marginBottom: 16, fontSize: "0.9rem" }}>
        Data source: <code>/api/execution/run</code> ·{" "}
        <Link href="/dashboard/ar" style={{ textDecoration: "underline" }}>
          AR dashboard (demo)
        </Link>
      </p>

      {msg ? <p style={{ color: "#064", marginBottom: 12 }}>{msg}</p> : null}
      {err ? (
        <p style={{ color: "#b00020", marginBottom: 12 }} role="alert">
          {err}
        </p>
      ) : null}

      <form onSubmit={onSubmitStudy} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <label style={{ fontSize: "0.875rem" }}>
          Study key{" "}
          <input name="study_key" defaultValue={studyKey} style={{ padding: 8, marginLeft: 6 }} />
        </label>
        <button type="submit" disabled={loading} style={{ padding: "8px 14px" }}>
          {loading ? "…" : "Load"}
        </button>
        <button type="button" disabled={loading} onClick={() => void sync()} style={{ padding: "8px 14px" }}>
          Sync missing → Action Center
        </button>
      </form>

      {!state ? null : (
        <>
          <section style={{ marginBottom: 20 }} aria-label="Operational signals">
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Operational signals</h2>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              <li>Missing revenue: {state.leakage.missingRevenue.toFixed(2)}</li>
              <li>Missing count: {state.leakage.missingLineCount}</li>
              <li>
                Sync status:{" "}
                {state.actionCenterSync.attempted
                  ? state.actionCenterSync.error
                    ? `failed (${state.actionCenterSync.error})`
                    : `ok (upserted ${state.actionCenterSync.upserted})`
                  : "not run"}
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Top missing billables</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  {["rank", "lineCode", "severity", "estimatedRevenueAtRisk", "expectedRevenue", "actualAmount"].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 6 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topMissing.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 8, color: "#666" }}>
                      None
                    </td>
                  </tr>
                ) : (
                  (topMissing as MissingExecutionLineState[]).map((m) => (
                    <tr key={m.lineCode}>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{m.priorityRank}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{m.lineCode}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{m.severity}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{m.estimatedRevenueAtRisk.toFixed(2)}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{m.expectedRevenue.toFixed(2)}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{m.actualAmount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Totals</h2>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              <li>Total events: {state.headline.totalEvents}</li>
              <li>Total expected billables: {state.headline.totalExpectedBillables}</li>
              <li>Total billable instances: {state.headline.totalBillableInstances}</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Expected vs actual</h2>
            <ul style={{ margin: "0 0 12px", paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
              <li>Matched lines: {state.comparisonSummary.matchedLineCount}</li>
              <li>Missing lines: {state.comparisonSummary.missingLineCount}</li>
              <li>Total lines: {state.comparisonSummary.totalLineCount}</li>
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Leakage</h2>
            <p style={{ fontSize: "0.85rem", color: "#444", marginBottom: 6 }}>
              Revenue leakage total: {state.revenueLeakage.summary.totalValue.toFixed(2)} · items:{" "}
              {state.revenueLeakage.summary.totalItems}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  {["id", "leakageValue", "reason"].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 6 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.revenueLeakage.data.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 8, color: "#666" }}>
                      None
                    </td>
                  </tr>
                ) : (
                  state.revenueLeakage.data.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{r.id}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{r.leakageValue}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{r.reason ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Recent event_log</h2>
            <JsonTable
              rows={state.recent.eventLog}
              keys={["event_date", "visit_name", "event_type", "subject_id", "study_id"]}
            />
          </section>
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Recent expected_billables</h2>
            <JsonTable
              rows={state.recent.expectedBillables}
              keys={["visit_name", "line_code", "expected_quantity", "expected_revenue"]}
            />
          </section>
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Recent billable_instances</h2>
            <JsonTable
              rows={state.recent.billableInstances}
              keys={["fee_code", "status", "amount", "quantity", "execution_study_key"]}
            />
          </section>
        </>
      )}
    </main>
  )
}
