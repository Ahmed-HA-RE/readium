# HomePage — Phase 2

## Overview

This phase implements the **left sidebar** — sticky (stays visible on scroll and during pagination), navigation-only. Renders a list of destination links for authenticated users. Fully hidden for anonymous (no-session) visitors.

## Requirements

### Setup

- Create the `HomePageSidebar` component.
- Match the design in `@/context/screenshots/medium-homepage.png` **exactly** — spacing, icon placement, and styling.
- Wrap it in `layout.tsx` inside `<SidebarProvider>`.
  - Reference: https://ui.shadcn.com/docs/components/base/sidebar
  - shadcn MCP server is already set up — use it first; fall back to the docs link if it's unavailable.

### Visibility

- Anonymous (no session) → sidebar is not rendered at all, not just visually hidden.
- Authenticated → renders the full nav list below.

### Nav Items (authenticated users only)

| Route                 | Icon                                                   | Label                                                                                                              |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `/`                   | `import { IoHome } from "react-icons/io5"`             | Home                                                                                                               |
| `/me/stories`         | `import { IoNewspaperOutline } from "react-icons/io5"` | Stories                                                                                                            |
| `/me/lists/bookmarks` | `import { MdLibraryBooks } from "react-icons/md"`      | Library                                                                                                            |
| `/me/lists/likes`     | `import { FaRegHeart } from "react-icons/fa"`          | Likes                                                                                                              |
| `/me`                 | `import { FaRegUser } from "react-icons/fa"`           | Profile — renders a mini profile snapshot only: name, image, bio, website, and total counts of bookmarks and likes |

**Note on Library:** `/me/lists/bookmarks` will later become a tabbed dashboard (Bookmarks / Likes / Comments, with Bookmarks as the default tab) — not part of this phase, just flagging it so the route isn't built as if it's permanently single-purpose.

## References

- `@/context/project-overview.md`
- `@/context/plans/readium-homepage.md`
- `@/context/screenshots/medium-homepage.png`
- https://ui.shadcn.com/docs/components/base/sidebar
