import { getActionCenterPersistenceAdapter } from "./get-persistence-adapter"
import { getActionCenterPersistenceMode } from "./persistence-config"

/** Local / ops sanity check: current env mode and how many items the adapter lists. */
export async function validateActionCenterPersistenceMode() {
  const mode = getActionCenterPersistenceMode()
  const adapter = getActionCenterPersistenceAdapter()

  const items = await adapter.listActionItems()

  return {
    mode,
    itemCount: items.length,
  }
}
