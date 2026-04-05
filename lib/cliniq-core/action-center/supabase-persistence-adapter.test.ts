import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { mapActionCenterItemToRow } from "./persistence-mappers"
import type { ActionCenterItem } from "./types"
import {
  createSupabasePersistenceAdapter,
  SupabasePersistenceAdapter,
} from "./supabase-persistence-adapter"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}))

function baseDbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "row-1",
    study_id: "STUDY-1",
    sponsor_id: null,
    subject_id: "SUB-1",
    visit_name: "V1",
    line_code: "LAB",
    action_type: "prepare_invoice",
    owner_role: "billing",
    priority: "medium",
    status: "open",
    title: "T",
    description: "D",
    expected_amount: 50,
    invoiced_amount: 0,
    missing_amount: 50,
    leakage_status: "missing",
    leakage_reason: "not_invoiced",
    event_log_id: null,
    billable_instance_id: null,
    invoice_period_start: null,
    invoice_period_end: null,
    source_hash: null,
    metadata: {},
    created_at: "2026-04-01T12:00:00.000Z",
    updated_at: "2026-04-01T12:00:00.000Z",
    resolved_at: null,
    ...overrides,
  }
}

function makeItem(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "item-1",
    studyId: "STUDY-1",
    subjectId: "SUB-1",
    visitName: "V1",
    lineCode: "LAB",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "medium",
    status: "open",
    title: "T",
    description: "D",
    expectedAmount: 10,
    invoicedAmount: 0,
    missingAmount: 10,
    leakageStatus: "missing",
    leakageReason: "not_invoiced",
    ...overrides,
  }
}

function mockClientForList(rows: Record<string, unknown>[], listError: { message: string } | null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: listError })
  const select = vi.fn().mockReturnValue({ order })
  const from = vi.fn().mockReturnValue({ select })
  return { from, select, order }
}

describe("SupabasePersistenceAdapter (STEP 8, mocked client)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("listActionItems maps rows into domain items", async () => {
    const row = baseDbRow({
      id: "mapped-id",
      study_id: "S99",
      subject_id: "SUB99",
      line_code: "MRI",
    })
    const { from, order } = mockClientForList([row], null)
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    const items = await adapter.listActionItems()

    expect(from).toHaveBeenCalledWith("cliniq_action_items")
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: "mapped-id",
      studyId: "S99",
      subjectId: "SUB99",
      lineCode: "MRI",
    })
  })

  it("listActionItems applies deterministic sorting", async () => {
    const rows = [
      baseDbRow({ id: "z-low", priority: "low", missing_amount: 100 }),
      baseDbRow({ id: "a-high", priority: "high", missing_amount: 10 }),
      baseDbRow({ id: "b-high", priority: "high", missing_amount: 20 }),
      baseDbRow({ id: "m-medium", priority: "medium", missing_amount: 5 }),
    ]
    const { from } = mockClientForList(rows, null)
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    const items = await adapter.listActionItems()
    expect(items.map((i) => i.id)).toEqual(["b-high", "a-high", "m-medium", "z-low"])
  })

  it("upsertActionItems sends correct rows", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "cliniq_action_items") return { upsert }
      return {}
    })
    const adapter = new SupabasePersistenceAdapter({ from } as never)
    const item = makeItem({ id: "u-1", missingAmount: 42 })

    await adapter.upsertActionItems([item])

    expect(upsert).toHaveBeenCalledTimes(1)
    const [records, options] = upsert.mock.calls[0] as [Record<string, unknown>[], { onConflict: string }]
    expect(options).toEqual({ onConflict: "id" })
    expect(records).toHaveLength(1)
    const expected = mapActionCenterItemToRow(item)
    expect(records[0]).toMatchObject({
      id: expected.id,
      study_id: expected.study_id,
      missing_amount: expected.missing_amount,
      action_type: expected.action_type,
      status: expected.status,
    })
    expect(typeof records[0].created_at).toBe("string")
    expect(typeof records[0].updated_at).toBe("string")
  })

  it("updateActionItemStatus sets resolved_at correctly when status is resolved", async () => {
    let capturedPatch: Record<string, unknown> | undefined
    const select = vi.fn().mockResolvedValue({ data: [{ id: "x" }], error: null })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
      capturedPatch = patch
      return { eq }
    })
    const from = vi.fn().mockReturnValue({ update })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await adapter.updateActionItemStatus({ itemId: "x", status: "resolved" })

    expect(capturedPatch?.status).toBe("resolved")
    expect(capturedPatch?.resolved_at).toBe(capturedPatch?.updated_at)
    expect(typeof capturedPatch?.updated_at).toBe("string")
    expect(eq).toHaveBeenCalledWith("id", "x")
  })

  it("updateActionItemStatus clears resolved timestamp when status is not resolved", async () => {
    let capturedPatch: Record<string, unknown> | undefined
    const select = vi.fn().mockResolvedValue({ data: [{ id: "x" }], error: null })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
      capturedPatch = patch
      return { eq }
    })
    const from = vi.fn().mockReturnValue({ update })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await adapter.updateActionItemStatus({ itemId: "x", status: "in_progress" })

    expect(capturedPatch?.status).toBe("in_progress")
    expect(capturedPatch?.resolved_at).toBeNull()
  })

  it("appendActionItemEvent inserts correct payload", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "cliniq_action_item_events") return { insert }
      return {}
    })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await adapter.appendActionItemEvent({
      actionItemId: "ai-1",
      eventType: "status_change",
      fromStatus: "open",
      toStatus: "in_progress",
      actorType: "user",
      actorId: "usr-1",
      note: "n",
      payload: { k: 1 },
    })

    expect(from).toHaveBeenCalledWith("cliniq_action_item_events")
    expect(insert).toHaveBeenCalledWith({
      action_item_id: "ai-1",
      event_type: "status_change",
      from_status: "open",
      to_status: "in_progress",
      actor_type: "user",
      actor_id: "usr-1",
      note: "n",
      payload: { k: 1 },
    })
  })

  it("missing env throws missing_supabase_env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")

    expect(() => createSupabasePersistenceAdapter()).toThrow("missing_supabase_env")
  })

  it("whitespace-only env vars throw missing_supabase_env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "   ")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "\t")

    expect(() => createSupabasePersistenceAdapter()).toThrow("missing_supabase_env")
  })

  it("Supabase errors are surfaced as failed_to_list_action_items", async () => {
    const { from } = mockClientForList([], { message: "db down" })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await expect(adapter.listActionItems()).rejects.toThrow("failed_to_list_action_items")
  })

  it("Supabase errors are surfaced as failed_to_upsert_action_items", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "conflict" } })
    const from = vi.fn().mockReturnValue({ upsert })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await expect(adapter.upsertActionItems([makeItem()])).rejects.toThrow("failed_to_upsert_action_items")
  })

  it("Supabase errors are surfaced as failed_to_update_action_item_status", async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: "nope" } })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await expect(adapter.updateActionItemStatus({ itemId: "x", status: "open" })).rejects.toThrow(
      "failed_to_update_action_item_status",
    )
  })

  it("Supabase errors are surfaced as failed_to_append_action_item_event", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "rls" } })
    const from = vi.fn().mockReturnValue({ insert })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await expect(
      adapter.appendActionItemEvent({ actionItemId: "a", eventType: "t" }),
    ).rejects.toThrow("failed_to_append_action_item_event")
  })

  it("update with empty result throws action_item_not_found", async () => {
    const select = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    const adapter = new SupabasePersistenceAdapter({ from } as never)

    await expect(adapter.updateActionItemStatus({ itemId: "missing", status: "open" })).rejects.toThrow(
      "action_item_not_found",
    )
  })
})
