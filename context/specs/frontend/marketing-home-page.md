# Marketing Home Page

## Overview

Add a marketing landing page for anonymous (no-session) visitors, matching Medium's approach exactly. Reuse the existing `Header` component (already session-aware) so unauthenticated users never have a route to app-specific actions.

## Requirements

### Visual Match

- Match `@/context/screenshots/marketing-hero-homepage.jpg` **exactly**.
- Background is orangish in the reference — apply it using the existing color tokens already defined in `global.css`, not a hardcoded value.

### Trusted Badge

- Use shadcn's `Badge` component.
- Left icon: `import { PiUsersThreeFill } from "react-icons/pi"`
- Content: **"Trusted by 10,000+ writers"**

### Decorative SVG Icons

- Two SVG icon components already exist at `apps/web/components/icons` — import and place them exactly as shown in the screenshot (left and right sides, with the curved/rotated styling visible in the reference).
- These are `.tsx` components, not network-loaded assets — no extra setup needed beyond importing them.

### CTA

- One button only: **"Get Started"**, `primary` variant (reflects app's brand color).
- **Do not** add a second CTA button, even though the screenshot shows two.
- Navigates to `/login`.

### Subtitle

- Not finalized yet — propose a few options for the subtitle under the title so I can pick one.

---

## Session Handling (Important — avoid duplicate requests)

**The problem:** Both `(main)/layout.tsx` and `(main)/page.tsx` need session data, but Next.js doesn't allow passing session as props from layout to page/children, and we don't want to fetch it twice.

**The fix — use React's `cache()`:**

- Wrap `/lib/actions/user/getCurrentLoggedInUser` in `cache()`.
- This deduplicates the fetch — if multiple Server Components call it during the same render, only **one** HTTP request actually fires.
- Remove the current pattern of passing `session` as a prop into `Header` — instead, `Header` calls the cached function directly itself.
- In `(main)/page.tsx`, call `getCurrentLoggedInUser()` and branch:
  - No session → render the `Marketing` component.
  - Has session → render `children` (the normal authenticated app content passed down from the layout).

---

## Marquee

### Setup

- Install shadcn/studio's **Hero 27** block.
- Keep **only** `marquee.tsx` from what the block adds — delete everything else it scaffolds.
- Brand icons come from the `thesvg` package (already installed) — import as React components, no need to source/build custom logo SVGs.
- Recolor the logos to match the app's brand color — check the `app` token in `global.css` first; ask if it's unclear which token to use.

### Companies to Include

```tsx
import { Google } from '@thesvg/react';
<Google variant='wordmark' className='h-6 w-6' />;

import { Microsoft } from '@thesvg/react';
<Microsoft variant='wordmark' className='h-6 w-6' />;

import { Dropbox } from '@thesvg/react';
<Dropbox variant='wordmark' className='h-6 w-6' />;

import { Shopify } from '@thesvg/react';
<Shopify variant='wordmark' className='h-6 w-6' />;

import { Stripe } from '@thesvg/react';
<Stripe variant='wordmark' className='h-6 w-6' />;

import { Github } from '@thesvg/react';
<Github variant='wordmarkDark' className='h-6 w-6' />;

import { Slack } from '@thesvg/react';
<Slack variant='wordmarkDark' className='h-6 w-6' />;
```

## References

- `@/context/project-overview.md`
- `@/context/screenshots/marketing-hero-homepage.jpg`
