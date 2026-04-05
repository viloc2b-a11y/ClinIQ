"use client"

import { ActionCenterQueue } from "@/components/action-center/action-center-queue"
import { ActionCenterSummary } from "@/components/action-center/action-center-summary"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  ActionCenterItem,
  ActionCenterResult,
  ActionCenterRowAction,
} from "@/lib/cliniq-core/action-center"
import { getActionCenterClient } from "@/lib/cliniq-ui/action-center/get-action-center-client"
import { mutateActionCenterClient } from "@/lib/cliniq-ui/action-center/mutate-action-center-client"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" }

export default function ActionCenterPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" })
  const [actionCenter, setActionCenter] = useState<ActionCenterResult | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedItem =
    actionCenter?.items.find((item) => item.id === selectedItemId) ?? null

  const closeDrawer = useCallback(() => setSelectedItemId(null), [])

  const handleDrawerAction = useCallback(
    async (action: ActionCenterRowAction, item: ActionCenterItem) => {
      if (action !== "mark_in_progress" && action !== "mark_resolved") {
        return
      }

      setActionError(null)
      try {
        const response = await mutateActionCenterClient({
          itemId: item.id,
          action,
        })
        setActionCenter(response.result)
      } catch {
        setActionError("Failed to apply action")
      }
    },
    [],
  )

  const load = useCallback(async () => {
    setLoadState({ status: "loading" })
    try {
      const data = await getActionCenterClient()
      setSelectedItemId(null)
      setActionError(null)
      setActionCenter(data)
      setLoadState({ status: "success" })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error"
      setLoadState({ status: "error", message })
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(timerId)
  }, [load])

  return (
    <main className="mx-auto min-h-svh max-w-6xl px-4 py-10 pb-24 sm:px-6">
      <header className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            ClinIQ
          </p>
          <h1 className="text-foreground mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Action Center
          </h1>
          <div className="text-muted-foreground/70 mt-2 max-w-xs text-[11px] leading-snug tracking-wide">
            <p>Server-backed mock state</p>
            <p className="mt-0.5">Resets on restart</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      {loadState.status === "loading" && (
        <Card>
          <CardContent className="text-muted-foreground py-16 text-center text-sm">
            Loading Action Center...
          </CardContent>
        </Card>
      )}

      {loadState.status === "error" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Failed to load Action Center</CardTitle>
            {loadState.message ? (
              <CardDescription className="text-foreground/90">{loadState.message}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loadState.status === "success" && actionCenter && (
        <>
          {actionError ? (
            <p className="text-destructive mb-4 text-sm" role="alert">
              {actionError}
            </p>
          ) : null}
          <ActionCenterSummary summary={actionCenter.summary} />
          <ActionCenterQueue
            items={actionCenter.items}
            selectedItem={selectedItem}
            onItemSelect={(item) => setSelectedItemId(item.id)}
            onCloseDrawer={closeDrawer}
            onAction={handleDrawerAction}
          />
        </>
      )}
    </main>
  )
}
