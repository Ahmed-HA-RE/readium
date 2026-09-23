# Blog Page

## Overview

A single blog/story page, accessible to both authenticated and anonymous visitors. Anonymous users see the full page (not the marketing page) — this is intentional, so authors can share blog links on social media and have them render properly even for non-logged-in viewers. A social share dialog will handle that flow, but it's a **later phase**, not this one. This phase covers the blog content itself and the comments section (auth required to comment).

## Routing

- New dynamic route: `app/[blogSlug]/`
- If there's no `blogSlug` param → redirect to `/`.
- If `getBlogBySlug` returns no matching blog → also redirect to `/`.
  - Combine both conditions with an OR check rather than handling them as two separate redirect paths.

## Visual Reference

Match `@/context/screenshots/medium-story-page.png` — with these explicit exceptions:

- **Exclude:** Follow button (next to author image/name), Listen button. Neither is backed by the current API response.
- **If the screenshot shows anything else the backend doesn't currently return** — flag it and ask before adding it to the frontend. Do not build UI for data that doesn't exist yet.

---

## Component Refactor (Important — do this before building new UI)

### Like & Bookmark

- Currently embedded inside `apps/web/components/shared/blog-card.tsx`.
- Extract each into its own component inside `components/shared/`.
- Move the `toggleLike` / `toggleBookmark` handlers and their associated `useOptimistic` hooks along with them.
- Both extracted components accept `isLikedByLoggedInUser` / `isBookmarkedByLoggedInUser` as props.
- **Why:** this page needs the same like/bookmark behavior as the blog card — extracting avoids duplicating the optimistic-update logic across two routes.

### Report Dialog → Rename

- The dropdown trigger is an ellipsis icon, but the component/file is currently named `report-blog.tsx` — too narrow, since this dropdown will likely grow to include more actions later (e.g. **Mute author**, **Follow author**).
- Rename the component and file to reflect its actual role as a general actions dropdown, not just "report." Update every import referencing the old name accordingly.

### Share Button

- Add as a static, non-functional placeholder for now: `<IoShareOutline />` (icon left) + "Share" (label right).
- No behavior yet — the actual share dialog is a future phase.

---

## Content Rendering — HTML, not plain text

- Blog `content` is currently stored as plain string in the database, but going forward (once the create-blog feature ships with TipTap) it will be saved as HTML.
- Render it with `dangerouslySetInnerHTML` to prepare for that format now, rather than switching renderers later.
- **Action needed on my end:** update the seed data so each blog's `content` field is saved as HTML — flag this so the seed CLI can be re-run once that's done.

---

## Comments Section

Positioned at the end of the content, matching Medium's placement. Uses infinite scroll (no pagination).

### Data Fetching

- `useInfiniteQuery()` — https://tanstack.com/query/latest/docs/framework/react/reference/functions/useInfiniteQuery
- `react-intersection-observer` for viewport detection — https://github.com/thebuilder/react-intersection-observer
- Follow both docs closely for the hook setup and for wiring the intersection `ref` onto the sentinel `<div>`.

### Hook State → UI Mapping

| State                    | Behavior                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data` (check `.length`) | If empty: render an empty state — "There are no comments for this blog yet. Be the first to share your opinion."                                                                                               |
| `isPending`              | Show a loading spinner (indicates more comments are being fetched)                                                                                                                                             |
| `isError` / `error`      | Render inside shadcn/studio's **Alert 30** component (MCP server already set up — fetch it from there). Remove the description slot from that component; render only the icon and the backend's error message. |

### Comment Card Layout

Two columns:

- **Left:** author avatar
- **Right:** flex-column —
  - Top: author name, with the comment's timestamp below it, formatted via the existing `formatPublishedAt` util (from `web/lib/utils`) — e.g. "3 days ago" or "Sep 1"
  - Bottom: comment content (plain string — **not** `dangerouslySetInnerHTML`, unlike the blog content itself)

### Add Comment Form

- Submits via the existing `createComment` service.
- Layout: flex-column —
  - Top row (flex-row): current logged-in user's avatar + name
  - Below: an `InputGroup` (shadcn) wrapping a `Textarea`, with a "Respond" button embedded inside it — refer to shadcn MCP server for the `Textarea` + `InputGroup` combination example.
  - Textarea must **not** be resizable.

### Validation

```ts
const createCommentSchema = z.object({
  content: z
    .string({ error: 'Comment content is required' })
    .min(
      3,
      'Please add at least 3 characters long to share your opinion on the blog',
    )
    .max(500, 'You have reached the maximum length for sharing your comment'),
});
```

## References

- `@/context/project-overview.md`
- `@/context/screenshots/medium-story-page.png`
- https://tanstack.com/query/latest/docs/framework/react/reference/functions/useInfiniteQuery
- https://github.com/thebuilder/react-intersection-observer
