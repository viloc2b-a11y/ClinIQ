# ClinIQ (Next.js)

Internal product shell — separate from legacy marketing or VRG site code.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase client (`@supabase/ssr` + `@supabase/supabase-js`).

## Setup

```bash
cd "path/to/cliniq"
cp .env.example .env.local   # fill Supabase URL + anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

See `docs/product-architecture.md` and `features/README.md`.

## Build

```bash
npm run build && npm start
```

Run commands from this directory so `turbopack.root` matches this app.
