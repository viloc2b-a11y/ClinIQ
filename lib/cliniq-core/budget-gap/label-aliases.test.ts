import { describe, expect, it } from "vitest"

import { applyBudgetLabelAliases } from "./label-aliases"
import { normalizeFieldForBudgetMatch } from "./normalize"

describe("applyBudgetLabelAliases", () => {
  it("maps sponsor synonyms to stable tokens", () => {
    expect(applyBudgetLabelAliases("start-up fee")).toContain("__startup__")
    expect(applyBudgetLabelAliases("site activation")).toContain("__startup__")
    expect(applyBudgetLabelAliases("screen visit 1")).toContain("__screening__")
    expect(applyBudgetLabelAliases("scr")).toContain("__screening__")
    expect(applyBudgetLabelAliases("randomization visit")).toContain("__randomize__")
    expect(applyBudgetLabelAliases("baseline")).toContain("__randomize__")
    expect(applyBudgetLabelAliases("follow-up")).toContain("__followup__")
    expect(applyBudgetLabelAliases("follow up")).toContain("__followup__")
    expect(applyBudgetLabelAliases("fu")).toContain("__followup__")
    expect(applyBudgetLabelAliases("close-out")).toContain("__closeout__")
    expect(applyBudgetLabelAliases("archiving")).toContain("__closeout__")
    expect(applyBudgetLabelAliases("screen failure fee")).toContain("__screen_fail__")
    expect(applyBudgetLabelAliases("screen fail")).toContain("__screen_fail__")
    expect(applyBudgetLabelAliases("sf")).toContain("__screen_fail__")
    expect(applyBudgetLabelAliases("specimen processing")).toContain("__lab_ship__")
    expect(applyBudgetLabelAliases("dry ice")).toContain("__lab_ship__")
    expect(applyBudgetLabelAliases("pharmacy")).toContain("__pharm__")
    expect(applyBudgetLabelAliases("drug accountability")).toContain("__pharm__")
    expect(applyBudgetLabelAliases("regulatory amendment review")).toContain(
      "__reg_amend__",
    )
    expect(applyBudgetLabelAliases("amendment admin")).toContain("__reg_amend__")
  })
})

describe("normalizeFieldForBudgetMatch", () => {
  it("collapses alias-expanded text to comparable tokens", () => {
    const a = normalizeFieldForBudgetMatch("Screening visit")
    const b = normalizeFieldForBudgetMatch("SCR")
    expect(a).toBe(b)
  })
})
