# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File                     | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

## Data loading

| Area                                        | Pattern                        | Where                                          |
| ------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| Public pages (`/`, `/gallery`, `/projects`) | Route `loader` + SSR           | `src/routes/*.tsx`                             |
| Admin (`/admin/*`)                          | React Query + server functions | `src/lib/admin-queries.ts`, `src/hooks/admin/` |
| Mutations (admin writes)                    | `useMutation` wrappers         | `src/lib/mutations/`                           |
| Cache updates after saves                   | `*-cache.ts` helpers           | `src/lib/booking-cache.ts`, etc.               |

**Rule:** Public routes fetch in loaders; admin routes fetch in hooks. Don't call `useServerFn` from public components except forms (e.g. booking request).

## Admin routes

Admin route files should stay thin: page meta, one hook, composed components under `src/components/admin/`. Business logic lives in `src/hooks/admin/` and `src/lib/mutations/`.
