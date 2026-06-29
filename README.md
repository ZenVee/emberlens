# Ember Lens

Photography studio site and admin CMS built with TanStack Start, React, and Supabase.

## Stack

- **Frontend:** React 19, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** TanStack Start server functions, Supabase (Postgres + Auth)
- **Media:** Fivemanage CDN, server-side watermarking
- **Deploy:** Vite + Nitro (Cloudflare Workers via Lovable)

## Prerequisites

- Node.js 22+
- A Supabase project with schema from `supabase/schema.sql` (or run migrations in `supabase/migrations/` in filename order)

## Environment variables

Create `.env.local` (or set in your deploy environment):

| Variable                        | Where           | Description                     |
| ------------------------------- | --------------- | ------------------------------- |
| `VITE_SUPABASE_URL`             | Client + server | Supabase project URL            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + server | Supabase anon/publishable key   |
| `FIVEMANAGE_API_KEY`            | Server only     | Fivemanage image upload API key |

Public booking requests are rate-limited (5/hour per IP). For a **new** database, run `supabase/schema.sql` in the SQL editor first; incremental migrations are for existing installs only.

Admin access uses Discord OAuth configured in the Supabase dashboard. Users must have `is_admin = true` on their `profiles` row.

## Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start local dev server   |
| `npm run build`      | Production build         |
| `npm run preview`    | Preview production build |
| `npm run lint`       | ESLint                   |
| `npm test`           | Run unit tests (Vitest)  |
| `npm run test:watch` | Vitest watch mode        |
| `npm run format`     | Prettier                 |

## Tests

Unit tests live next to source files as `*.test.ts` under `src/lib/`. CI runs lint, test, and build on push/PR to `main`/`master`.

## Project layout

```
src/
  routes/          File-based routes (public + /admin)
  components/      UI and domain components
  lib/             Server functions, Supabase, shared logic
  hooks/           React hooks
supabase/
  schema.sql       Master schema
  migrations/      Incremental SQL migrations
```
