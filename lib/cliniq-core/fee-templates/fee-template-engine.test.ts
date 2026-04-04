import { describe, expect, it, vi } from "vitest"

import { sameBillableSourceKey, subjectDedupeKey } from "./billable-dedupe"
import { createBillableFromEvent } from "./create-billable-from-event"
import { EVENT_TO_FEE_CODE, mapClinicalEventTypeToFeeCode } from "./event-mapping"
import { computeInvoiceDueDateIso } from "./invoice-due"
import { BILLABLE_SUBJECT_DEDUPE_NIL } from "./types"
import { promoteEarnedToInvoiceable } from "./promote-invoiceable"
import {
  ALL_STARTER_TEMPLATE_FEE_CODES,
  STARTER_FEES_EXTENDED,
  feeCodesUnique,
} from "./starter-fees"
import { FEE_ENGINE_BEHAVIORS } from "./fee-taxonomy"

describe("fee template engine (TS)", () => {
  it("maps all v1 clinical events to fee codes (parity with map_clinical_event_to_fee_code)", () => {
    expect(mapClinicalEventTypeToFeeCode("cta_fully_executed")).toBe("SF-START-001")
    expect(mapClinicalEventTypeToFeeCode("screening_visit_completed")).toBe("PP-SCR-001")
    expect(mapClinicalEventTypeToFeeCode("followup_visit_completed")).toBe("PP-FUP-001")
    expect(mapClinicalEventTypeToFeeCode("screen_failure_confirmed")).toBe("INV-SF-001")
    expect(mapClinicalEventTypeToFeeCode("amendment_approved")).toBe("INV-AMD-001")
    expect(Object.keys(EVENT_TO_FEE_CODE)).toHaveLength(5)
  })

  it("maps case-insensitively and returns null for unknown events", () => {
    expect(mapClinicalEventTypeToFeeCode("  CTA_FULLY_EXECUTED  ")).toBe("SF-START-001")
    expect(mapClinicalEventTypeToFeeCode("unknown_event")).toBeNull()
  })

  it("subjectDedupeKey matches Postgres nil uuid for null subject", () => {
    expect(subjectDedupeKey(null)).toBe(BILLABLE_SUBJECT_DEDUPE_NIL)
    expect(subjectDedupeKey("sub-1")).toBe("sub-1")
  })

  it("sameBillableSourceKey aligns with subject_dedupe semantics", () => {
    const a = {
      studyId: "s1",
      feeCode: "PP-SCR-001",
      sourceEventId: "e1",
      subjectId: null as string | null,
    }
    expect(sameBillableSourceKey(a, { ...a })).toBe(true)
    expect(
      sameBillableSourceKey(a, { ...a, subjectId: "sub-1" }),
    ).toBe(false)
  })

  it("computeInvoiceDueDateIso adds UTC calendar days", () => {
    expect(computeInvoiceDueDateIso("2026-03-01T10:00:00.000Z", 45)).toBe("2026-04-15")
    expect(computeInvoiceDueDateIso("2026-03-01T10:00:00.000Z", 0)).toBe("2026-03-01")
  })

  it("createBillableFromEvent uses build-spec RPC parameter names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "f47ac10b-58cc-4372-a567-0e02b2c3d479", error: null })
    const client = { rpc } as never
    const r = await createBillableFromEvent(client, {
      p_event_type: "cta_fully_executed",
      p_event_id: "e0000000-0000-4000-8000-000000000099",
      p_study_id: "c0000000-0000-4000-8000-000000000001",
      p_site_id: "b0000000-0000-4000-8000-000000000001",
      p_subject_id: null,
      p_visit_id: null,
      p_occurred_at: "2026-04-01T12:00:00.000Z",
    })
    expect(r.id).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479")
    expect(r.error).toBeNull()
    expect(rpc).toHaveBeenCalledWith(
      "create_billable_from_event",
      expect.objectContaining({
        p_event_type: "cta_fully_executed",
        p_event_id: "e0000000-0000-4000-8000-000000000099",
        p_visit_id: null,
        p_occurred_at: "2026-04-01T12:00:00.000Z",
      }),
    )
  })

  it("createBillableFromEvent returns null id when RPC returns null (e.g. auto_create_billable false)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const client = { rpc } as never
    const r = await createBillableFromEvent(client, {
      p_event_type: "cta_fully_executed",
      p_event_id: "e0000000-0000-4000-8000-000000000088",
      p_study_id: "c0000000-0000-4000-8000-000000000001",
      p_site_id: "b0000000-0000-4000-8000-000000000001",
      p_subject_id: null,
      p_visit_id: null,
    })
    expect(r.id).toBeNull()
    expect(r.error).toBeNull()
  })

  it("promoteEarnedToInvoiceable returns updated row count", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 3, error: null })
    const client = { rpc } as never
    const r = await promoteEarnedToInvoiceable(client, null)
    expect(r.updatedCount).toBe(3)
    expect(rpc).toHaveBeenCalledWith("promote_earned_to_invoiceable", {
      p_billable_id: null,
    })
  })

  it("starter template lists 30 unique fee codes (5 core + 25 extended)", () => {
    expect(ALL_STARTER_TEMPLATE_FEE_CODES).toHaveLength(30)
    expect(feeCodesUnique(ALL_STARTER_TEMPLATE_FEE_CODES)).toBe(true)
  })

  it("extended fees use only supported engine_behavior literals", () => {
    for (const f of STARTER_FEES_EXTENDED) {
      expect(FEE_ENGINE_BEHAVIORS).toContain(f.engine_behavior)
    }
  })

  it("ADMIN-OVER-001, CONT-BUF-001, INF-ADJ-001 do not auto-create billables (v1)", () => {
    const byCode = Object.fromEntries(STARTER_FEES_EXTENDED.map((f) => [f.fee_code, f]))
    expect(byCode["ADMIN-OVER-001"]?.auto_create_billable).toBe(false)
    expect(byCode["ADMIN-OVER-001"]?.engine_behavior).toBe("pricing_rule")
    expect(byCode["CONT-BUF-001"]?.auto_create_billable).toBe(false)
    expect(byCode["CONT-BUF-001"]?.engine_behavior).toBe("negotiation_only")
    expect(byCode["INF-ADJ-001"]?.auto_create_billable).toBe(false)
    expect(byCode["INF-ADJ-001"]?.engine_behavior).toBe("negotiation_only")
  })
})
