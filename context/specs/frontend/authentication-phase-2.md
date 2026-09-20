# Authentication — Phase 2

## Overview

Add the **forgot-password** and **reset-password** routes, sharing the same layout as login/sign-up (left column form changes per route). Also refactor the API invocation layer from `fetch()` to **axios** so we stop repeating the base URL on every call.

## Requirements

### Axios Migration

- Install axios and set up an instance at `web/lib/axios.ts`.
  - Base URL comes from `API_URL` in `/lib/constants/index.ts`.
  - Reference: https://axios.rest/pages/advanced/create-an-instance.html
  - **Important:** include `credentials` on the instance so authenticated endpoints don't fail.
- Refactor existing `fetch()` calls to use this axios instance — currently only in `/lib/actions` (2 files).

### Routing

- Create `forgot-password` and `reset-password` inside `app/(auth)/` so they inherit the shared auth layout.

---

## Feature 1 — Forgot Password

- Flow reference: https://better-auth.com/docs/authentication/email-password#request-password-reset
- The flow and email notification are already tested manually via Postman — only the frontend integration is needed.
- Pass `redirectTo: {SITE_URL}/reset-password` to the request.
- Below the submit button, add a "Back to login" link:
  - Left arrow icon: `import { FaArrowLeft } from "react-icons/fa6"`
  - `Button` gets `className="group"`; the icon gets a `group-hover` translate-x animation (shifts 0.5 left on hover).

---

## Feature 2 — Reset Password

### Token Handling (SSR)

- On page load, read the `token` query param server-side.
  - If missing, or if the query param is `error=INVALID_TOKEN` → redirect to `/login`.
  - Otherwise, pass the token down to the client component.
- Call `authClient.resetPassword` to complete the reset.

### Success State (UI/UX — important)

- In `reset-password-form.tsx`, add `[isSuccess, setIsSuccess]` state.
- `authClient.resetPassword` takes `onSuccess`/`onError`:
  - `onSuccess` → set `isSuccess` to `true`.
- Conditionally render based on `isSuccess`:
  - `false` → reset password form
  - `true` → `ResetPasswordConfirmation` component
- **Note:** `ResetPasswordConfirmation` must be its own file inside the domain's `_components/` folder — do not inline it in the same file as the form.

### Confirmation Component

Simple flex column layout:

1. Green checkmark shield — `import { IoShieldCheckmark } from "react-icons/io5"`, styled green via `className`.
2. Heading: **"Password Reset Successful"**
3. A `Link` button back to `/login` — outlined, green border, same left-arrow + "Back to login" pattern as the forgot-password route.

### Zod Schema

I already added the validations for both forms in `/web/schema/auth.ts` file

---

## SEO — Robots

- Create `app/robots.ts` to prevent search engines from crawling auth-gated routes that only make sense when reached via a valid redirect.
- Add `/reset-password` to the `disallow` list.
- Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

## References

- `@/context/project-overview.md`
- https://axios.rest/pages/advanced/create-an-instance.html
- https://better-auth.com/docs/authentication/email-password#request-password-reset
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
