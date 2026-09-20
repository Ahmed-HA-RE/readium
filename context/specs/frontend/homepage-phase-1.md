# HomePage — Phase 1

## Overview

This phase focuses exclusively on the **header** — it sets the UI/UX pattern for the rest of the app. It includes: a "Write" action navigating to its own route, an auth dropdown, notifications (WebSocket-powered live updates come in a later phase — likes, bookmarks, etc.), a command palette for search, and a left sidebar toggle.

## Layout

Two columns.

**Left side:**

- Hamburger icon + Logo
- `Command` component (search)

**Right side:**

- Button → navigates to `/new-story`. Icon: `<FaEdit />` from `react-icons`. Label: "Write".
- Bell icon: `import { GoBell } from "react-icons/go"`
- Dark mode toggle
- Profile dropdown:
  - Avatar (left) + user's name (right), with a `<small>` "View Profile" link below the name, navigating to `/profile`
  - "Settings" → navigates to `/settings`
  - **Important — conditional rendering:** if `user.isPro` is `false` (hardcode this to `false` for now — real subscription check comes later), render "Become a Readium member 🌟" linking to `/plans`. If `true`, don't render it at all.
  - Logout / Sign out

## Sidebar Trigger

- Icon: `import { FaBars } from "react-icons/fa6"`
- Color: `text-muted-foreground` — subtle, slightly grayish/opaque, matching the Medium header reference screenshot.
- Must be a Client Component (`'use client'`) — it triggers the left sidebar open state on click.

## Search — Frontend

Use shadcn's `Command` component, wired to real backend data (no mock data).

### Data Flow

- `lib/actions/` → fetch function that calls the backend endpoint.
- `hooks/` → a `useQuery` hook wrapping that fetch, for client-side interactivity.

### Behavior

- On palette open: show a skeleton while fetching, then render the latest 3 users and latest 3 blogs.
- On typing: debounce input, only fire the query once the value is **longer than 2 characters**, then refetch with the typed value.
- Each result group ("Users", "Blogs") gets an `<h4>` heading above its list — same visual pattern as Readium/Medium's search.
- If a group returns zero results, hide that group's heading and section entirely (check `.length` before rendering).

## Search — Backend

### Setup

Create a dedicated `search` module (kept separate/scalable for future filtering features, even though it's one controller for now):

```bash
nest g module search && nest g controller search --no-specs && nest g service search --no-specs
```

### Controller

- Base route: `api/search`
- Endpoint: `/suggestions`
- Validates query params via `SuggestionQueryDto`

### Service

- Returns the latest 3 blogs and latest 3 users.
- Search must be case-insensitive — use `mode: 'insensitive'` in the Prisma query.
- **Open question — needs a decision before implementing:** when there are many matching users, should the 3 returned be the most recent (static/deterministic), or randomly shuffled from the matches? Flag this and confirm before implementing — don't assume either way.

### DTO

`search` domain validation:

```ts
export class SuggestionQueryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  q: string;
}
```

## References

- `context/project-overview.md`
- `context/screenshots/medium-homepage.png`
- `context/plans/readium-homepage.md`
