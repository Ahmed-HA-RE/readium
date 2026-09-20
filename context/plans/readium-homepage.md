# Homepage — Medium-style shell, feed and search

## Context

The backend is finished; `apps/web` is not. The only UI that exists is `app/(auth)/*` (login,
sign-up, forgot/reset password). `app/page.tsx` is still the stub `<h1>Welcome to the Home Page</h1>`,
there is no header, no sidebar, no blog card, no data layer for blogs, and `components/` contains
nothing but `ui/`.

This plan builds the homepage as the first real product surface: a Medium-shaped app shell
(collapsible sidebar + sticky header + search palette) around a paginated, sortable feed of published
blogs. Target is ~80% of Medium's architecture and feel, not a pixel copy. Reference:
`context/screenshots/medium-hompage.png`.

It is also the first feature to use the TanStack Query SSR setup that history #10 configured and
deliberately left unused — `lib/get-query-client.ts` already dehydrates pending queries, so a server
prefetch streams into a client `useQuery` without retrofitting.

**Explicitly out of scope** (user's call): the yellow subscription banner (no Stripe yet), the entire
right-hand rail (Staff Picks / Recommended topics), and working notifications.

Build order is **six sequenced slices**. Each one compiles and renders on its own; do not start the
next until the previous is verified in a browser.

---

## Slice 1 — Backend: the shared search endpoint

One new module. It serves both halves of the palette: with no `q` it returns the latest 3 users and
latest 3 blogs (the palette's empty state), with `q` it searches both. This is why there is no
separate "latest users" endpoint.

**New — `apps/backend/src/search/`** (scaffold with the bare `nest` CLI, `nest g module search` etc.):

- `dto/search-query-dto.ts` — `SearchQueryDto`:
  - `q?: string` — `@IsOptional() @IsNotEmpty() @IsString() @MaxLength(100)`
  - `limit?: number` — `@Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(10)`
  - Validate at the DTO, never clamp in the service — same rule history #5 and #7 landed on.
    `@Max` matters: every row costs an S3 presign.
- `utils/search-query.ts` — `buildSearchFilters(q)`. **Do not reuse `buildBlogQuery`**
  (`src/blogs/utils/blog-query.ts`): its filter does `content: { contains }`, which is a full-text
  scan of every post body on every keystroke. The palette matches `title` and `author.name` only.
- `search.service.ts` — `searchUsersAndBlogs(query): Promise<GetSearchResults>`:
  - One `Promise.all([users, blogs])`, mirroring `AdminService.getDashboardAnalytics()`.
  - Users: `where: { NOT: { banned: true } }` (the column is `Boolean?`, so `banned: false` misses
    nulls) plus the `name` contains-filter when `q` is set; `orderBy: { createdAt: 'desc' }`,
    `take: limit ?? 3`, `select: { id, name, image }`.
  - Blogs: `where: { isPublished: true }` plus the filter; `orderBy: { createdAt: 'desc' }`,
    `take: limit ?? 3`, `select: { id, title, slug, createdAt, author: { select: { id, name } } }`.
  - Presign `user.image` through the existing `S3ServiceService.getSignedUrl` — `SearchModule` must
    import `S3ServiceModule`, as `CommentsModule` does. Use `satisfies Prisma.UserSelect` /
    `Prisma.BlogSelect`, never a type annotation (histories #2–#4).
- `search.controller.ts` — `@Controller('api/search')`, `GET /` with `@AllowAnonymous()`.
  Add `@Throttle({ default: { ttl: minutes(1), limit: 120 } })`: this is the one endpoint a human
  legitimately hits several times a second, and the 60/min global would 429 ordinary typing.
- Register `SearchModule` in `apps/backend/src/app.module.ts`.

**New — `packages/types/src/search.ts`**, re-exported from `packages/types/index.ts`:
`SearchUser`, `SearchBlog`, `GetSearchResults { users: SearchUser[]; blogs: SearchBlog[] }`.
Follow `packages/types/src/blogs.ts`; the package stays dependency-free (history #4).

**Tests** — `search.service.spec.ts` in the style of `users.service.spec.ts`: empty `q` returns
newest-first, `q` filters both collections, banned users are excluded, `limit` is honoured, and
`getSignedUrl` is called once per user with an image and never for a null one.

---

## Slice 2 — Frontend data layer

The standards doc (`context/coding-standards-monorepo.md:132-148`) mandates `lib/server/<domain>.ts`
and `hooks/`, but the shipped code is `lib/actions/user/<oneFnPerFile>.ts`. **Adopt `lib/server/`
here** — this is the first feature with a real data layer, and the existing two files can be moved
later.

- `apps/web/lib/server/blogs.ts` — `getAllBlogs({ sort, page, limit, cookie? })`, returns
  `Promise<GetAllBlogsResponse>`. Uses the existing `api` instance from `lib/axios.ts`, passing
  params through axios `params` (base URL already ends in `/api`, so the path is `/blogs`).
- `apps/web/lib/server/search.ts` — `searchUsersAndBlogs({ q, limit })` → `Promise<GetSearchResults>`.

**The one trap that will bite.** These modules are imported by both the server page and a client
hook, so they must never import `next/headers` — that breaks the client bundle. But
`withCredentials` does nothing server-side (histories #10 and #11, proven twice by execution): the
server must send `headers: { Cookie: (await cookies()).toString() }` by hand. Resolution: both
functions take an **optional `cookie` string**; the server page reads `cookies()` and passes it in,
the hook passes nothing.

The server prefetch **must** forward the cookie. `GET /api/blogs` personalizes
`isLikedByLoggedInUser` / `isBookmarkedByLoggedInUser` for a session, so a cookieless prefetch and a
cookied client refetch would produce two different bodies under one query key and hydrate wrong.

- `apps/web/lib/query-options/blogs.ts` — a `blogsQueryOptions({ sort, page })` factory returning
  `queryOptions({ queryKey: ['blogs', { sort, page }], queryFn })`. The server prefetch and the
  client `useQuery` both consume it, so the key cannot drift. This is the piece that makes hydration
  work; do not hand-write the key twice.
- `apps/web/hooks/use-blogs.ts` — `useBlogs({ sort, page })` wrapping the factory.
- `apps/web/hooks/use-search.ts` — `useSearch(debouncedTerm, { enabled })`, key
  `['search', debouncedTerm]`, `placeholderData: keepPreviousData` so the palette list does not blank
  between keystrokes. Match the shape of the existing `hooks/user.ts`.

Note: presigned S3 URLs expire in 4 hours (`s3-service.service.ts:37`). Leave the 60s `staleTime`
from `get-query-client.ts` alone; do not raise it past an hour for these queries.

---

## Slice 3 — shadcn components and theme prep

```
pnpm dlx shadcn@latest add sidebar skeleton command avatar dropdown-menu select pagination
pnpm add date-fns --filter web
```

- The project style is `base-nova` (**Base UI, not Radix**) — `components.json:2`. The CLI resolves
  the Base UI variants automatically; `command` still pulls `cmdk` as a dependency, which is
  expected. `sidebar` pulls `sheet`, `tooltip`, `separator`, `input`, `button`, `skeleton`.
- `globals.css` already defines the full `--color-sidebar-*` token set, so the sidebar themes itself
  with no CSS work.
- Small fix worth taking now: `app/layout.tsx` applies Roboto via `roboto.className`, so the
  `--font-sans` that `@theme` points at is fed by nothing. Give the font `variable: '--font-sans'`
  and put the variable class on `<html>`.
### Dark mode

Everything is already in place except the provider: `globals.css:5` declares
`@custom-variant dark (&:is(.dark *))`, the `.dark` block at `globals.css:95` is fully defined, and
`next-themes@0.4.6` is installed but mounted nowhere. `components/ui/sonner.tsx` already calls
`useTheme()`, so toasts start following the theme the moment the provider exists.

History #9 records a previous dark-mode attempt that broke navigation with a hydration mismatch on
`<html>`. That is a known, solved problem — do it this way and it will not recur:

- Mount `<ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>`
  inside `app/providers.tsx` (already `'use client'`), wrapping `QueryClientProvider`. Do not try to
  mount it from the server root layout.
- `attribute='class'` is required — it is what the `@custom-variant` above keys on. Note the variant
  matches `.dark` **descendants**, so `dark:` utilities work everywhere below `<html>` but never on
  `<html>` itself.
- **Add `suppressHydrationWarning` to `<html>` in `app/layout.tsx`.** This is the actual fix for
  history #9. next-themes writes `class="dark"` and `style="color-scheme:dark"` onto `<html>` from a
  blocking inline script that runs *before* hydration, so the server HTML and the client DOM differ
  on that element by construction. The attribute is scoped to that one element's own attributes and
  suppresses nothing else in the tree; it is next-themes' documented requirement, not a workaround.
- The `.dark` block covers every token the shell needs, **including the full `--color-sidebar-*`
  set**, so no new CSS is required. The one gap is the three brand tokens `--app` / `--app-from` /
  `--app-to` (`globals.css:58-60`), which are defined only on `:root` and so keep their light values
  in dark. Leave them — a brand colour holding steady across themes is intended. Revisit only if one
  of them ends up on a dark surface and fails contrast.
- The toggle must guard on a `mounted` flag (or render a fixed icon until mounted). `useTheme()`
  returns `undefined` on the first render, so an unguarded toggle renders the wrong icon and flips
  after hydration — the same class of visible mismatch, just inside a component instead of on
  `<html>`.

---

## Slice 4 — The app shell

`(auth)` must not inherit the sidebar or header, so the shell goes in a **new `(main)` route group**,
not the root layout.

- **Move** `apps/web/app/page.tsx` → `apps/web/app/(main)/page.tsx`.
- **New** `apps/web/app/(main)/layout.tsx` — server component:
  - `await getCurrentLoggedInUser()` (existing, `lib/actions/user/getCurrentLoggedInUser.ts`) once
    here, passed down as a prop. Per the standing preference, read on the server and pass down
    rather than adding a client session hook.
  - Read the `sidebar_state` cookie server-side and pass it as `defaultOpen` to `SidebarProvider` —
    shadcn's documented pattern, and it removes the open/closed flash on first paint.
  - Renders `<SidebarProvider><AppSidebar/><SidebarInset><AppHeader user={user}/>{children}</SidebarInset></SidebarProvider>`.
- **New** `apps/web/components/layout/app-sidebar.tsx` — `collapsible='offcanvas'` (Medium's sidebar
  disappears entirely rather than shrinking to icons). Four items, each with a lucide icon, active
  state from `usePathname`:

  | Label   | Href          | Backing endpoint                    |
  |---------|---------------|-------------------------------------|
  | Home    | `/`           | `GET /api/blogs`                    |
  | Library | `/library`    | `GET /api/users/me/bookmarks`       |
  | Profile | `/u/:name`    | `GET /api/users/:username`          |
  | Stories | `/stories`    | `GET /api/users/me/blogs`           |

  Only Home has a page in this feature; the other three render as links to routes that land in later
  features. No Stats (no per-user analytics endpoint exists) and no Following (no follow model in the
  Prisma schema).
- **New** `apps/web/components/layout/app-header.tsx` — `'use client'`, because it contains
  `SidebarTrigger`, which calls `useSidebar()` and must sit inside the provider. It takes the
  server-read `user` as a prop, so the client boundary is the trigger and the dropdown only.
  Sticky, bottom-bordered, full width:

  `[☰ SidebarTrigger] [Readium logo → /] [SearchCommand] ···· [✎ Write → /new-story] [🔔 bell] [☀/🌙 theme] [avatar]`

  - `SidebarTrigger` already owns the `useSidebar()` call. Only reach for the hook directly if the
    icon should change with `state` — otherwise it is redundant.
  - Bell renders inert: a ghost icon button, no dot, no dropdown. It reserves the slot for the
    WebSocket notification feature without shipping a fake one.
  - **New** `apps/web/components/layout/theme-toggle.tsx` — `'use client'`, a ghost icon button
    calling `setTheme` from `useTheme()`, sun/moon from lucide, with the `mounted` guard described in
    slice 3. Cycle light ↔ dark directly (not through `system`); a three-way cycle is invisible to
    the user because two of the three states usually look identical.
  - Signed in → avatar `DropdownMenu` (Profile / Stories / Library / Sign out via
    `authClient.signOut`). Signed out → `Sign in` ghost + `Get started` solid, both preserving the
    `?callbackUrl=` convention the auth pages already use.
  - `APP_LOGO` from `@repo/assets` is already allowlisted in `next.config.js`.

**Verify this slice before adding the feed**: `/` shows the shell with the stub heading, the
hamburger opens and closes the sidebar, the state survives a reload, and `/login` and `/sign-up` are
still the bare two-column auth layout with no sidebar.

---

## Slice 5 — The feed

- **`apps/web/app/(main)/page.tsx`** — async server component:
  ```
  const { sort, page } = await searchParams;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(blogsQueryOptions({ sort, page }));   // with the cookie
  <HydrationBoundary state={dehydrate(queryClient)}> <FeedToolbar/> <BlogFeed/> </HydrationBoundary>
  ```
  First use of `HydrationBoundary` in the repo — the setup has been waiting since history #10.
- **`_components/feed-toolbar.tsx`** — `'use client'`. Sort `Select` (`newest` / `oldest` /
  `most_liked` — the exact `BlogSortOptions` values from `blog-query-dto.ts`) plus `Pagination`
  driven by `totalPages` from the response. Both write `?sort=` / `?page=` to the URL with
  `router.push`, wrapped in **`useTransition`** for the pending state — not a `useState` boolean.
  URL state is what makes the server prefetch correct on a deep link and the page shareable.
- **`_components/blog-feed.tsx`** — `'use client'`, reads `sort`/`page` from `useSearchParams`, calls
  `useBlogs`, renders `<BlogFeedSkeleton/>` while `isPending || isFetching` and the card list
  otherwise. Handle the empty case (`blogs.length === 0`) with a plain message.
- **`apps/web/components/blog/blog-card.tsx`** — the Medium row: author avatar + name + `·` +
  `format(date, 'MMM d')`, bold title, two-line excerpt, then a footer of like / comment counts from
  `_count`, with the cover image as a ~200×134 thumbnail on the right. Whole card links to
  `/:slug`. No like/bookmark/report buttons in this feature — the flags come back on the payload but
  the actions are their own feature.
- **`_components/blog-feed-skeleton.tsx`** — the same row geometry in `Skeleton`, so the list does
  not jump when data lands.

**Two things to watch:**

- `Blog.content` is stored raw. If it is markdown or HTML, a naive `slice(0, 160)` will show syntax
  in the excerpt. Strip to plain text before truncating, and check what the seed data actually
  contains before writing the helper.
- Cover images are **presigned URLs with a rotating `X-Amz-Signature` query string**. Running those
  through `next/image` optimization means a cache miss on every request. Use `unoptimized` on the
  cover `Image`, or a plain `<img>`, until there is a stable public URL.
- `createdAt` is typed `Date` in `@repo/types` but arrives over JSON as a string. Parse before
  formatting.

---

## Slice 6 — The search palette

- **`apps/web/components/search/search-command.tsx`** — `'use client'`, rendered in the header.
  A Medium-style rounded pill button (muted background, search icon, "Search") that opens
  `CommandDialog`. Bind `⌘K` / `Ctrl+K` too.
- Local `value` state, `useDebounce(value, 300)` (`use-debounce` is already installed and already
  used at `sign-up-form.tsx:33`), fed into `useSearch(debounced, { enabled: open })`. Open with an
  empty term → the latest 3 users + 3 blogs from slice 1.
- **Set `shouldFilter={false}` on `<Command>`.** cmdk filters client-side by default and would hide
  server-returned rows whose text does not literally match the typed string. This is the single
  easiest way to get a palette that mysteriously shows nothing.
- Two `CommandGroup`s — "People" (avatar + name) and "Stories" (title + author + date). Render
  `Skeleton` rows inside the groups while `isPending || isFetching`; `CommandEmpty` when both
  collections come back empty.
- `onSelect` → `router.push(...)`, then close the dialog.

**Routing collision — decide before writing the links.** `/:blogSlug` at the root means a bare
`/:username` cannot also live at the root; Next cannot disambiguate two dynamic segments at the same
level. Blogs keep `/:blogSlug` as requested, so **users go to `/u/:username`** (matching the sidebar
Profile link above). The alternative is Medium's `/@username`, which also works — but pick one now,
because both the palette and the sidebar hard-code it.

---

## Verification

Run both apps (`pnpm dev` from the repo root) and check in a real browser. Nine of the first ten
features in `context/current-feature.md` closed with "nothing was rendered in a browser"; history #11
broke that streak and this feature should not restart it.

Per slice:

1. **Search API** — `pnpm test` green in `apps/backend`; `SearchController {/api/search}` mapped at
   boot; `curl 'localhost:3001/api/search'` returns 3 + 3 newest while signed out (proves
   `@AllowAnonymous`), `?q=` filters both, `?limit=50` and `?q=` (empty string) return **400**, and a
   banned user never appears.
2. **Data layer** — `pnpm check-types` and `pnpm lint` clean in `apps/web`. Confirm in the Network
   tab that the SSR request to `/api/blogs` carries a `Cookie` header and the client one does not.
3. **Components** — build green after the shadcn adds; confirm nothing in `components/ui` was
   overwritten (the repo has local edits — `input.tsx` and `input-group.tsx` were changed from
   `ring-3` to `ring-1`).
4. **Shell** — hamburger toggles, state survives reload, `/login` is untouched, header renders both
   the signed-in and signed-out variants (test both). **Dark mode:** toggle flips the whole shell,
   the choice survives a reload and a soft navigation, there is **no flash of light** on a hard
   reload while dark, the console shows no hydration warning, and a toast renders dark. Then flip
   the OS to dark with the site never having been toggled and confirm `system` is respected.
5. **Feed** — view source on `/` and confirm the blog titles are in the **server-rendered HTML**
   (that is the whole point of the prefetch); changing sort and page updates the URL and the list;
   a skeleton appears between pages; `/?page=2` deep-links correctly; `/?sort=bogus` is handled.
6. **Palette** — opens on click and on ⌘K, shows 3 + 3 when empty, debounces (watch the Network tab:
   one request per pause, not per keystroke), a blog navigates to `/:slug` and a user to
   `/u/:username`.

Check the responsive layout at ~400px at the end of slices 4 and 5 — the sidebar becomes a sheet and
the blog card should stack rather than squeeze the thumbnail.

Then append a numbered entry to the bottom of `context/current-feature.md` following the existing
format (Implemented / Decisions worth remembering / Verified / Known gaps / Not included).
