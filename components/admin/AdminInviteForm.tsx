"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useState } from "react"

export function AdminInviteForm() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Could not send invite")
        return
      }
      setMsg(`Invitation sent to ${email.trim()}`)
      setEmail("")
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-base">Invite user</CardTitle>
        <CardDescription>
          Supabase sends an email with a link to set a password. Set{" "}
          <code className="rounded bg-muted px-1 text-xs">CLINIQ_PUBLIC_APP_URL</code> on the
          deploy so the link points to this app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Invitee email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="new.user@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send invite"}
          </Button>
        </form>
        {msg ? (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400" role="status">
            {msg}
          </p>
        ) : null}
        {err ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {err}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
