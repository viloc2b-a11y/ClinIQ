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
    <main className="mx-auto min-h-[min(100dvh,100vh)] max-w-6xl px-4 py-8 pb-20 sm:px-6 sm:py-10">
      <header className="mb-8 border-b border-border/60 pb-6 sm:mb-10">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Operations
        </p>
        <h1 className="text-foreground mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Action Center
        </h1>
        <div className="text-muted-foreground/80 mt-2 max-w-xl text-sm leading-relaxed">
          <p>Server-backed mock state · resets on restart</p>
        </div>
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
