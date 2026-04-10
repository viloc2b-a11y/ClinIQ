import { describe, expect, it } from "vitest"
import {
  expectedBillableRowsFromDraftPayload,
  mapNegotiationItemsToExpectedBillableRows,
} from "./map-to-expected-billable-rows"
import type { InternalBudgetLine } from "@/lib/cliniq-core/budget-gap/types"

describe("map-to-expected-billable-rows", () => {
  it("maps internal draft lines", () => {
    const internal: InternalBudgetLine[] = [
      {
        id: "int-1",
        category: "Visit",
        lineCode: "V1",
        label: "Visit 1",
        visitName: "Visit 1",
        quantity: 1,
        unit: "ea",
        internalUnitCost: 100,
        internalTotal: 100,
        notes: "",
        source: "internal-model",
      },
    ]
    const rows = expectedBillableRowsFromDraftPayload({
      siteId: "00000000-0000-4000-8000-0000000000aa",
      studyKey: "STUDY-X",
      internal_lines: internal,
      sponsor_lines: [],
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.study_key).toBe("STUDY-X")
    expect(rows[0]!.line_code).toBe("V1")
    expect(rows[0]!.expected_revenue).toBe(100)
    expect(rows[0]!.event_log_id).toBeNull()
  })

  it("maps negotiation items and skips rejected", () => {
    const rows = mapNegotiationItemsToExpectedBillableRows(
      [
        {
          source_line_id: "sl-1",
          line_code: "L1",
          label: "ECG",
          category: "Proc",
          visit_name: "V1",
          quantity: 1,
          unit: "ea",
          proposed_price: 150,
          current_price: 75,
          status: "pending",
        },
        {
          source_line_id: "sl-2",
          line_code: "L2",
          label: "X",
          category: "Y",
          visit_name: "V1",
          quantity: 1,
          unit: "ea",
          proposed_price: 0,
          current_price: 10,
          status: "rejected",
        },
      ],
      "00000000-0000-4000-8000-0000000000bb",
      "STUDY-1",
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.expected_revenue).toBe(150)
  })
})
