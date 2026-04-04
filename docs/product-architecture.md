# Product architecture (ClinIQ)

Placeholder for internal product documentation.

## Intended layers

- **Presentation:** Next.js App Router, React Server Components by default; Client Components only where needed.
- **Data:** Supabase (Postgres, Auth, Storage, Edge Functions as required).
- **Cross-cutting:** `lib/` for shared utilities; `types/` for shared TypeScript contracts.

## Feature modules

Implement vertical slices under `features/<feature-name>/` (components, hooks, actions) and keep routes thin in `app/`.

Details to be filled in as requirements are finalized.
