import { filterAuditRows, paginateAuditRows } from "./audit/pagination"
import { getActionCenterAuditStore } from "./audit/store/get-store"
import type { AuditStorePageInput, AuditStorePageResult } from "./audit/store/types"

export async function readAuditLogPage(
  input: AuditStorePageInput = {},
): Promise<AuditStorePageResult> {
  const store = getActionCenterAuditStore()

  if (typeof store.readPage === "function") {
    return store.readPage(input)
  }

  const rows = await store.list({
    id: input.id,
    step: input.step,
  })
  const filtered = filterAuditRows(rows, input)

  return paginateAuditRows(filtered, input)
}
