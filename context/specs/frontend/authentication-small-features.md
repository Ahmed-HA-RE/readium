# Authentication — Small Features

## Overview

Handle two auth edge cases: redirecting authenticated users away from auth routes, and live username availability checking before signup submits to the backend.

## Requirements

### TanStack Query Setup

- Install and configure TanStack Query in `apps/web` (frontend only).
- Follow the official setup docs: https://tanstack.com/query/latest/docs/framework/react/overview
- **Important — set this up correctly now, not later:** use Next.js App Router SSR prefetching with TanStack Query so we get both SEO (server-rendered data) and client-side interactivity (filtering, refetching) from the same data.
  - Prefetch data server-side, wrap the client tree in `HydrationBoundary`, then consume it with `useQuery` in the client component.
  - Reference implementation: https://tanstack.com/query/latest/docs/framework/react/examples/nextjs-app-prefetching?path=examples%2Freact%2Fnextjs-app-prefetching%2Fapp%2Fpokemon-info.tsx
  - If anything about this setup is unclear, ask before implementing — do not guess or configure it incorrectly.

### Standard Pattern for All Backend Calls

This is the pattern to follow for every future feature that talks to the backend, not just this one:

- `hooks/` → one file per domain, each containing that domain's `useQuery` calls (`queryKey`, `queryFn`, etc.)
- `lib/actions/<domain>/` → one file per action, each containing the raw `fetch()` call that hits the backend
- Every `fetch()` call must include `credentials` — several endpoints require authentication.
- **Both live at the `apps/web` root, not under `app/`.** `apps/web/lib/` already exists, and a
  second `app/lib/` would leave no obvious home for new shared code.
- **`credentials` is not enough on the server.** A `fetch()` from a Server Component runs in Node,
  which has no cookie jar, so `credentials: 'include'` attaches nothing and every call comes back
  401. Server-side actions must also forward the session cookie:
  `headers: { Cookie: (await cookies()).toString() }`. Client-side calls need only `credentials`.
- Query keys are written inline in the `useQuery` call — no exported key-factory objects. Reserve
  the `['users', ...]` key prefix for the admin user-filtering list, so the availability check uses
  `['username-taken', name]`.

---

## Feature 1 — Live Username Availability Check

### Backend

- Add a new endpoint to `user.controller.ts` (in `apps/backend/src`) that calls the existing `isUserNameTaken` service.
- The service already exists and is already used elsewhere — only the endpoint needs to be created.

### Frontend

- Use `useQuery` + the `use-debounce` package.
- Debounce keystrokes by 300–500ms before firing the request — do not call the endpoint on every keystroke.
- Make sure to display a response under the name field in the sign-up form where if it is taken render an error message saying name is already taken.
- **The name field uses shadcn's `InputGroup`, not the plain `Input`.** The status indicator sits
  hard right, inside the field, in an `InputGroupAddon align='inline-end'`:
  - checking → `Spinner`
  - available → check mark from `react-icons`, `text-emerald-600`
  - taken → X mark from `react-icons`, `text-red-600`
- **Available is signalled by the check mark alone — the border stays neutral.** Only the taken
  state colours the border, so success does not fight the focus ring or add a success colour the
  design system does not otherwise use.
- `input-group.tsx` ships shadcn's stock `ring-3`; it is changed to `ring-1` to match the edit
  already made to `input.tsx`, otherwise the grouped field's ring is visibly heavier than every
  other input on the form.

---

## Feature 2 — Redirect Authenticated Users Away From Auth Routes

### Backend

- Reuse the existing `getCurrentLoggedInUser` endpoint in `user.controller.ts` (already built, already used elsewhere).

### Frontend

- Create `app/lib/actions/user/getCurrentLoggedInUser.ts` — fetches the session and returns the response.
- In each auth route's Server Component (`sign-up`, `login`, `forgot-password`):
  - Call the action.
  - If a session exists, redirect to home using `redirect` from `next/navigation`.
- This action will be reused elsewhere in the app beyond just these three routes.

---

## Type Safety

Every backend call across the app follows this convention — apply it here too:

| Endpoint                 | Return Type                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `getCurrentLoggedInUser` | `Promise<GetCurrentLoggedInUser \| null>` — interface already defined in `packages/types/src/users.ts` |
| `isUsernameTaken`        | `Promise<boolean>` — no interface needed, it's a plain boolean                                 |

- **`| null` is required on `getCurrentLoggedInUser`.** `GET /api/users/me` answers 401 when there is
  no session, and a 401 cannot produce a `GetCurrentLoggedInUser` — `null` is what the redirect
  guard branches on.
- `apps/web` had no `@repo/types` dependency; it was added as `workspace:*` so these types resolve.
- The service is spelled `isUsernameTaken` (not `isUserNameTaken`) and lives on `UsersService`,
  having moved off `AdminUsersService`. The controller is `users.controller.ts`, plural.

## References

- `@/context/project-overview.md`
- https://tanstack.com/query/latest/docs/framework/react/overview
- https://tanstack.com/query/latest/docs/framework/react/examples/nextjs-app-prefetching?path=examples%2Freact%2Fnextjs-app-prefetching%2Fapp%2Fpokemon-info.tsx
