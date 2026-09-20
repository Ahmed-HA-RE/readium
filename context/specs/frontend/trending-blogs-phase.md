# Trending Blogs Phase

## Overview

Display the top 5 most-liked blogs on the right side of the Home Page, matching Medium's rendering of this exact feature.

## Backend

### Endpoint

- Controller: `getTrendingBlogs` in `apps/backend/src/blogs/blogs-controller.ts`
- Route: `trending`
- Decorate with `@AllowAnonymous()` — anonymous users can read this. (We already redirect to the Marketing component when there's no session, but add the decorator regardless as a defense-in-depth measure.)

### Service Logic

- Returns the **5 most-liked blogs**, `take: 5`.
- Tie-breaking: if two or more blogs share the same like count, the more recently created one wins.
  - Query order: `orderBy: [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]`
- **Only blogs that have at least one like qualify.** Filter: `likes: { some: {} }`.
  - `orderBy` sorts, it does not filter. Without this, a blog with zero likes still fills a slot and
    the panel silently degrades into "the 5 newest".
- **Include the current logged-in user's own blogs.** The list is identical for every caller.
  - Revised during implementation. This previously said to exclude them via
    `{ authorId: { not: userId } }`; that was dropped.

### Returned Fields

Only what Medium's trending panel actually displays:

- Blog title
- Blog `slug` — not rendered, but every panel item links to the blog, so it has to be returned
- Blog content (frontend will `line-clamp` this to a fixed length — backend returns full content, not pre-truncated)
- Author name
- Author image
- Blog `createdAt`

**Do not return:**

- `coverImage` not used by this feature.

**Author image handling:**

- Sign the author's image via `S3ServiceService.getSignedUrl` before returning it.
- If the user has no stored image but has an external `url` field populated instead, that indicates they signed up via OAuth (not credentials) — handle that case rather than assuming every user has a signable S3 image.

## Frontend

- Match `@/context/screenshots/medium-homepage.png` exactly for this feature's UI/UX.
- Reuse the existing `formatPublishedAt` util for date rendering — don't reimplement date formatting here.
- Call the endpoint via `axios`, invoked from the SSR (Server) component.

## References

- `@/context/project-overview.md`
- `@/context/screenshots/medium-homepage.png`
