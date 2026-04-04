# Module 2 — fee negotiation (cost model)

## Purpose

Turn **Module 1 site cost model output** into **per-fee negotiation zones**, **posture (strong / balanced / cross_line)**, **counter amounts**, and **rationale**—deterministic, no I/O.

Module 3’s **`NegotiationEngineInput`** (budget gap, `schemaVersion: "1.0"`) lives under `budget-gap/` and is unrelated to this type name on the barrel; Module 2 uses **`NegotiationEngineInput`** with **`schemaVersion: "2.0-cost-model"`** in `negotiation-types.ts`.

## Pipeline (order)

1. **Cost model** — `SiteCostModelOutput` from `cost-model/site-cost-model-v2.ts`
2. **Mapper** — `mapCostModelToNegotiationInput` → `NegotiationEngineInput` + `NegotiationFeeInput[]`
3. **Classifier** — `classifyFee` / `classifyAllFees` → `NegotiationZone` (`strategic_tag`)
4. **Strategy** — `deriveStrategy` → `FeeNegotiationStrategy`
5. **Counter** — `buildCounterDecision(s)` → counter, fallback, rationale
6. **Assembly** — `buildFeeNegotiationDecision(s)` → adds `label`, optional `notes`

Shortcut: call **`buildFeeNegotiationDecision`** on each fee; it delegates to **`buildCounterDecision`** (which already applies zone → strategy → counter in that order).

## Zones (`NegotiationZone`)

| Zone          | Meaning (simplified)                                      |
| ------------- | --------------------------------------------------------- |
| **must_win**  | Economics or risk require holding the line (floor / SAE / margin). |
| **defendable**| Gap vs sponsor or thin margin—negotiate toward target.    |
| **tradeoff**  | Room to concede on price or trade for terms.              |

## Posture (`FeeNegotiationStrategy`)

| Strategy       | Meaning (simplified)                                |
| -------------- | --------------------------------------------------- |
| **strong**     | Tradeoff zone + solid sponsor offer + healthy cash-adjusted margin (≥ 25%). |
| **balanced**   | Defendable zone, or offer between floor and target, or margin between 0 and 25%. |
| **cross_line** | Must-win zone, offer below floor, or cash-adjusted margin ≤ 0. |

## Sponsor offer unknown

If **`sponsor_offer === null`**, classification treats “below floor / below target” as false (no numeric offer). **Counter** still sets **`counter_offer`** to **`target_price`** with **`fallback_action`** `anchor_target_unknown_offer`.
