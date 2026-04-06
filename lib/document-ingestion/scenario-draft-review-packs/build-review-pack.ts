import type { ScenarioDraft } from "../scenario-drafts/types"
import { buildReviewPackCode } from "./build-review-pack-code"
import type { ScenarioDraftReviewPack } from "./types"

export function buildReviewPack(args: {
  familyKey: ScenarioDraft["familyKey"]
  structureIntent: ScenarioDraft["structureIntent"]
  drafts: ScenarioDraft[]
}): ScenarioDraftReviewPack {
  return {
    code: buildReviewPackCode({
      familyKey: args.familyKey,
      structureIntent: args.structureIntent,
    }),
    familyKey: args.familyKey,
    structureIntent: args.structureIntent,
    drafts: [...args.drafts],
    summary: {
      totalDrafts: args.drafts.length,
      firstDraftCode: args.drafts[0]?.code ?? null,
      nullFamilyCount: args.drafts.filter((draft) => draft.familyKey === null).length,
    },
  }
}
