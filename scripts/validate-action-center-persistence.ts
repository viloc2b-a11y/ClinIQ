/**
 * Print Action Center persistence mode and item count (STEP 7).
 *
 *   npx tsx scripts/validate-action-center-persistence.ts
 *
 * For `supabase` mode, set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment.
 */

import { validateActionCenterPersistenceMode } from "../lib/cliniq-core/action-center/validate-persistence-mode"

validateActionCenterPersistenceMode()
  .then(({ mode, itemCount }) => {
    console.log(`mode=${mode} itemCount=${itemCount}`)
  })
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
