# Authentication — Phase 1

## Overview

Authentication will span multiple routes and phases. Phase 1 covers **Sign Up** and **Login**. Users can log in or create an account via **credentials** or **OAuth**.

## Requirements

### Layout & Routing

- Group both routes in `app/(auth)/` with a shared `layout.tsx` so it doesn't inherit from the root `app/layout.tsx`.
- Shared layout: image on the right, form content on the left.
- Image path: `authentication-image.png` (reference from `/public` — do not include `/public` in the path, Next.js will throw a warning).
- Layout renders conditionally based on the route: login route → login form, sign-up route → sign-up form.

### Metadata

- Add minimal metadata for both routes — `title` and `description` only.
- Keep the copy natural and human, not AI-generated sounding.

### UI Reference

- Follow the design in `@/context/screenshots/authentication-1.png` exactly.
- The screenshot only shows the sign-up form — the login route reuses the same shared layout with the login form on the left instead.
- If the screenshot is ambiguous or you're unsure how to interpret something, ask — do not guess or generate something unrelated to the design.

### Navigation Between Routes

- Not shown in the screenshot, but add navigation between Login and Sign Up on the same line as the logo, right-aligned.
- Use **Button 16** from shadcn-studio.
- Flip the arrow icon to the right side of the button.
- Button label and target route change based on which auth route the user is currently on.
- Append a `callbackUrl` query param to this navigation link.

### Login-Specific

- Add a "Forgot password?" link that navigates to `/forgot-password`.

### Callback URL Behavior

- `callbackUrl` is read server-side (SSR) and passed to the authClient.
- Purpose: when an unauthenticated user is redirected to login from a protected action (e.g. clicking "Create Post"), they should land back on that original page after authenticating.
- This value also carries over when a user navigates between the login and sign-up routes.

### Icons

- Do not use the icon package bundled with shadcn — use `react-icons` (already installed).
- Arrow icon: `import { FaArrowRight } from "react-icons/fa6"`

## Form

### Setup

- Use `react-hook-form`, `zod`, and shadcn's `Field` component.
- `react-hook-form` and `zod` are already installed — only install the `Field` component from shadcn.
- Follow shadcn's official form pattern: https://ui.shadcn.com/docs/forms/react-hook-form

### Schema

- Create `app/schema/auth.ts` containing the login and sign-up Zod schemas.

```ts
const passwordSchema = z
    .string({ error: 'Password is required' })
    .min(8, 'Password length must be at least 8 characters '),
    .regex(/[a-z]/, 'Password should contain at least one lowercase letter');

const signUpSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: z.email(),
  password: passwordSchema
  confirmPassword: passwordSchema
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
  });

  const loginSchema = z.object({
    email:signUpSchema.shape.email,
    password:passwordSchema
  })

```

### Submission

- On success, call the credentials login/signup authClient method — refer to Better Auth docs if needed.
- **Important:** every authClient call must include both `onSuccess` and `onError` handlers.
- Show the API's returned message via toast in both cases — refer to shadcn's `Toast` component setup.

## OAuth

### Providers

- Google and GitHub, already configured in `apps/backend/lib/auth.ts`.
- Call `authClient.signIn.social` — no additional backend setup needed.

### Component Requirements

- **Do not create two separate buttons.** Build a single reusable button component that accepts a `provider` prop and renders the correct icon/label based on the value.
- Icons:
  - GitHub: `import { FaGithub } from "react-icons/fa"`
  - Google: `import { FcGoogle } from "react-icons/fc"`
- This component must be shared and rendered on both the login and sign-up routes.

## References

- `@/context/screenshots/authentication-1.png`
- https://ui.shadcn.com/docs/forms/react-hook-form
- Better Auth docs (for authClient reference)
