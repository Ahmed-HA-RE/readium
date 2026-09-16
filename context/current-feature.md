<!-- Feature Title -->

## HomePage — Phase 1 (Header)

<!-- Feature Description -->

## Description

The homepage header, which sets the UI/UX pattern for the rest of the app. Two columns: on the left
a sidebar trigger (`FaBars`), the logo and a shadcn `Command` search palette; on the right a "Write"
button routing to `/new-story`, a notification bell (`GoBell`), a dark mode toggle and a profile
dropdown. The header is responsive — on small screens it collapses to a search icon plus the
profile dropdown. Search is wired to real backend data through a new NestJS `search` module —
`GET /api/search/suggestions` returns the latest 3 users and 3 blogs, case-insensitive, validated by
`SuggestionQueryDto`.

<!-- Feature Notes -->

## Notes

- **Open question — answered: most recent, deterministic.** When many users match the query the 3
  returned are ordered `createdAt: 'desc'`, the same ordering the blogs use. Random shuffling was
  rejected: results would jump between keystrokes, the TanStack Query cache would be meaningless,
  and bounding it needs raw SQL (`ORDER BY random()`).
- **Signed-out header shows Sign in + Get started.** The homepage is public, so the Write button,
  the bell and the profile dropdown only render with a session; anonymous visitors get the two auth
  links instead. The sidebar trigger, logo and search palette render either way.
- **Responsive collapse at `lg` (added on top of the spec).** Below `lg` the `Command` palette
  renders as a search icon only — tapping it opens the same dialog. The Write button, the bell and
  the dark mode toggle all move **inside** the profile dropdown, so the small-screen header is
  sidebar trigger + logo + search icon + avatar. At `lg` and up everything sits inline as the spec
  describes and the dropdown carries only its own items.
- **Notifications are display-only in this phase.** WebSocket-powered live updates (likes,
  bookmarks) come in a later phase; the bell is the shell for them.
- **`user.isPro` is hardcoded `false`** on the frontend for the "Become a Readium member 🌟" link —
  the same placeholder situation as `PLACEHOLDER_IS_PRO` in `users.service.ts` (history #4). When
  `true`, the item is not rendered at all.
- **The sidebar trigger must be a Client Component** — it drives the sidebar open state. Everything
  else in the header stays server-rendered where it can.
- **Search data flow:** `lib/actions/` holds the fetch that calls the endpoint, `hooks/` wraps it in
  a `useQuery`. TanStack Query is already configured for App Router SSR (history #10), and
  `lib/axios.ts` is the HTTP layer (history #11).
- **Debounce, and only fire above 2 characters.** The palette shows a skeleton on open, then the
  latest 3 users and 3 blogs.
- **Empty groups disappear entirely** — check `.length` before rendering a group's `<h4>` heading
  *and* its list.
- **Scaffold with the bare `nest` CLI:** `nest g module search && nest g controller search
  --no-specs && nest g service search --no-specs`.
- **Dark mode has bitten this repo before** — the earlier attempt broke navigation via a hydration
  mismatch on `<html>`-adjacent state. The toggle here is exposed to the same trap, and putting it
  inside a dropdown on small screens does not change that.
- **`/new-story`, `/profile`, `/settings` and `/plans` do not exist yet** — the header links to them
  regardless, so they 404 until later phases.

<!-- Feature Goals-->

## Goals

1. Answer the open question on user-result ordering (most recent vs. shuffled) before writing the
   service.
2. Scaffold the `search` module, controller and service with the Nest CLI and register it in
   `app.module.ts`.
3. `GET /api/search/suggestions` — `SuggestionQueryDto` validation, case-insensitive Prisma query
   (`mode: 'insensitive'`), latest 3 blogs and 3 users, with the response shape declared in
   `packages/types`.
4. Jest unit tests for the search service.
5. Build the header: sidebar trigger, logo, `Command` palette, Write button, bell, dark mode toggle
   and profile dropdown with its conditional Pro item.
6. Wire the palette to the endpoint through `lib/actions/` and a `hooks/` `useQuery`, with debounce,
   the >2 character threshold, a loading skeleton and hidden empty groups.
7. Make the header responsive — search icon in place of the palette, and Write, bell and dark mode
   folded into the profile dropdown on small screens.
8. Verify in a browser at both widths — the palette opens, fetches, renders both groups, hides a
   group that returns nothing, and every collapsed action still works from inside the dropdown.

<!-- Feature Status -->

## Status

In Progress

<!-- History -->

## History

### 1. Admin Dashboard Analytics — completed 2026-09-06

Backend-only analytics for the admin dashboard. `GET /api/admin/analytics` (admin role only)
returns six platform-wide counts through the shared `AdminDashboardAnalytics` interface.

**Implemented**

- `AdminService.getDashboardAnalytics()` in `apps/backend/src/admin/admin.service.ts` — runs all
  counts through a single `Promise.all([])` instead of sequentially.
- `GET /api/admin/analytics` in `apps/backend/src/admin/admin.controller.ts`, guarded by
  `@Roles(['admin'])`.
- `AdminDashboardAnalytics` interface in `packages/types/src/admin.ts`, shared between the backend
  response and the future frontend consumer.
- `User.lastActivityAt` (nullable, indexed) added in migration
  `20260906101655_add_user_last_activity_at`, backfilled from `createdAt`.
- `LastActivityInterceptor` in `apps/backend/src/common/interceptors/` — registered globally via
  `APP_INTERCEPTOR`, refreshes `lastActivityAt` at most once every 15 minutes per user, fire and
  forget so it never delays or breaks a request.
- `date-fns` installed and used for both the 30 day window and the interceptor throttle.
- 12 Jest tests: `admin.service.spec.ts` (5) and `last-activity.interceptor.spec.ts` (7).

**Decisions worth remembering**

- **Total Subscribers is hardcoded to 10.** No subscription or Stripe model exists yet. Replace
  `PLACEHOLDER_TOTAL_SUBSCRIBERS` in `admin.service.ts` when subscriptions land.
- **Total Active Users needed a new column.** Sessions were rejected as the activity signal because
  better-auth deletes session rows on sign-out and defaults to a 7 day expiry, which would
  undercount a 30 day window.
- **Jest, not Vitest.** `project-overview.md` was corrected to match. The backend dependency tree
  (`uuid@14`, `@thallesp/nestjs-better-auth`, `@nestjs/mapped-types`) is ESM-only and the latter two
  use `import.meta`, which Jest cannot load once transpiled to CommonJS. Any spec that imports a
  NestJS controller will hit this; the analytics controller spec was dropped for that reason and the
  endpoint verified live instead (route mapped at boot, 401 when unauthenticated).
- `apps/backend/package.json` gained a `moduleNameMapper` (strips `.js` specifiers from the
  generated Prisma client) and `transformIgnorePatterns` for `uuid`. These were the first tests in
  the repo, so the Jest harness had never actually been run before.

**Not included:** the analytics cards UI, which the spec defers to a later feature.

### 2. Admin Own Profile Endpoints — completed 2026-09-06

Three self-service read endpoints for the admin dashboard, mirroring the existing
`/api/admin/users/:username` family but fixed to the signed-in admin. All guarded by
`@Roles(['admin'])`.

**Implemented**

- `GET /api/admin/me` — profile scalars plus `_count` (blogs, comments, bookmarks, likes).
- `GET /api/admin/me/blogs` — the admin's blogs, offset-paginated and filterable.
- `GET /api/admin/me/comments` — the admin's comments, cursor-paginated.
- `buildAdminUserSelect(includeModerationData)` in
  `apps/backend/src/admin/users/utils/user-query.ts` — the shared profile `select`, with the
  moderation columns switched off for the self view.
- `getUserByUsername` gained an `includeModerationData` parameter defaulting to `true`, so the
  existing moderation route is unchanged.
- `AdminService.getMyDataAsAdmin/getMyBlogsAsAdmin/getMyCommentsAsAdmin` delegate to
  `AdminUsersService` with `session.user.name`.
- `GetMyDataAsAdmin` in `packages/types/src/admin.ts` as
  `Omit<GetUserByUsernameAsAdmin, 'banned' | 'banReason'>`; `GetUserByUsernameAsAdmin` narrowed to
  scalars plus a four-field `_count`.
- 16 Jest tests: `admin-users.service.spec.ts` (12) and 4 added to `admin.service.spec.ts`.
  Suite is 28 passing.

**Decisions worth remembering**

- **`/api/admin/users/:username` is a moderation surface and was not reused for self.**
  `getAllUsersAsAdmin` filters `role: { equals: 'user' }` and `updateUser` throws
  `ForbiddenException` for both self and other admins, so self-service already lived under
  `/api/admin/*`. Reusing it would have returned dead `banned` / `banReason` fields and rendered
  edit affordances the matching `PUT` rejects.
- **No embedded blog/comment lists on the profile.** Comments are cursor-paginated, so an embedded
  first page carries no `nextCursor` and the UI would have to synthesise one from the last embedded
  row — correct only while both queries keep identical `orderBy` and `select`, which nothing
  enforces. `_count.blogs > blogs.length` drives the "view more" affordance instead.
- **Delegation, not new queries.** `User.name` is `@unique` and the session carries it, so the `/me`
  handlers pass `session.user.name` into the existing `AdminUsersService` methods. An earlier
  attempt to parameterise on `Prisma.UserWhereUniqueInput` was dropped as unnecessary.
- **`satisfies Prisma.UserSelect`, never a type annotation.** Annotating the const collapses
  Prisma's literal inference and stops the result shape being checked.
- **Fixed: unstable cursor ordering.** `getUserCommentsByUsernameAsAdmin` ordered by `createdAt`
  alone while cursoring on `id`; ties made the cursor ambiguous and pages could skip or repeat rows.
  Now `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]`.
- **Fixed (untracked): `prisma/seed.ts` inserted comments quadratically.** The `createMany` inside
  the per-comment loop re-mapped the whole `commentsSeedData` array, shadowing the loop variable, so
  30 seed comments became 900 rows. Replaced with one `createMany` over a `slug -> blogId` map.
  Development re-seeded: 901 comment rows -> 30. Note `prisma/seed.ts` is gitignored
  (`apps/backend/.gitignore:61`), so this fix exists only locally.

**Verified**

- `pnpm run build` and `tsc --noEmit` clean; `pnpm test` 28 passing.
- All three routes mapped at boot, and each returns 401 unauthenticated while an unknown path under
  `/api/admin/me` returns 404 — so the 401 comes from the guard, not a catch-all.
- Not verified: an authenticated response body, which needs admin credentials. Response shape rests
  on the declared return types plus the unit tests asserting the `select`.

**Not included:** the dashboard UI, and any `/me` write endpoints — `PUT /api/admin/settings`
already covers self-service updates.

### 3. User Management Phase 1 — Public Profile — completed 2026-09-08

The first user-facing account surface. `GET /api/users/:username` is public — anonymous and
unauthenticated callers included — and returns a user's public profile together with one filtered,
sorted, paginated page of their **published** blogs.

**Implemented**

- `UsersModule` / `UsersController` / `UsersService` in `apps/backend/src/users/`, scaffolded with
  the Nest CLI and registered in `app.module.ts`.
- `GET /api/users/:username`, marked `@AllowAnonymous()` so it clears the global `AuthGuard`.
  Returns `{ user, blogs, totalPages }` — no response envelope, matching every other endpoint.
- `UserBlogsQueryDto extends BlogQueryDto` in `dto/user-blogs-query-dto.ts` — pagination and sorting
  are identical to the blog feed, so they are inherited rather than duplicated.
- `buildUserBlogsFilter(search)` in `utils/user-query.ts` — title-or-content search only.
- `PublicUserProfile` and `GetUserProfileWithBlogs` in `packages/types/src/users.ts`, exported from
  `packages/types/index.ts`.
- 15 Jest tests in `users.service.spec.ts`. Suite is 43 passing.

**Decisions worth remembering**

- **Three spec items did not match the codebase.** The spec's `@AllowAnnonyms()` is really
  `@AllowAnonymous()` from `@thallesp/nestjs-better-auth`, and `BuildQueryDto` does not exist — the
  DTO that feeds `buildBlogQuery()` is `BlogQueryDto`. The spec also said `nest g module user`
  (singular) while `context/plans/user-management-plan.md` and every existing module are plural;
  **`users` was chosen**, so the route is `/api/users/:username` as the plan and the deferred
  frontend fetchers already assume.
- **`buildBlogQuery` is called with `search` as `undefined`.** Only `querySort`, `limitValue` and
  `pageValue` are destructured off it. Its `queryFilter` also matches `author.name`, which is dead
  weight once the blogs are scoped to one author by the enclosing `user.findUnique` — and it would
  quietly return every blog for a search term matching the username.
- **The `select` lives inline in the service, not in `utils/`.** Only `buildUserBlogsFilter` went to
  `utils/user-query.ts`, because Phase 2's `/api/users/me/blogs` is also single-author scoped and
  genuinely reuses it. The profile `select` would not have been shared: the plan gives the self view
  its own `buildSelfUserSelect()` (it adds `email` and splits `_count.blogs` into published/draft),
  so a `buildPublicUserSelect()` would still have had exactly one caller after Phase 2.
- **`banned` is selected but stripped before returning.** A banned account answers 404, so it is
  indistinguishable from one that never existed. `banned` never reaches the response, and a test
  asserts that.
- **`email`, `role` and `banReason` are never selected.** This payload is served to anonymous
  callers; a test asserts their absence so a later edit cannot leak them.
- **`_count` is returned, the comment list is not.** The spec's "do not fetch comments" is read as
  "do not embed the comment list" — `_count.comments` is kept because every blog card needs it, and
  a test pins both halves of that distinction.
- **`satisfies Prisma.UserSelect`, never a type annotation** — same reason as history #2.

**Verified**

- `nest build` compiles; `tsc --noEmit` reports nothing for `src/users`; `eslint src/users/**/*.ts`
  is clean.
- `pnpm test` — 43 passing (28 before, 15 added).
- Route mapped at boot: `UsersController {/api/users}` → `Mapped {/api/users/:username, GET}`.
- **Not verified:** live responses. The 404, the validation rejections and an authenticated-vs-
  anonymous body were not exercised with `curl`; behaviour rests on the unit tests plus the declared
  return type.

**Notes for later**

- `admin.service.spec.ts` fails `tsc --noEmit` on `main` (two `BlogQueryDto` argument errors) and
  `admin-users.service.spec.ts` has 23 `no-unsafe-*` lint errors. Both pre-date this feature and
  were left alone. The new spec avoids the same pattern by giving its mocks explicit
  `jest.Mock<Return, Args>` types.
- `pnpm lint` runs `eslint --fix`, so it **rewrites files**. It reformatted an unrelated
  `bookmarks.module.ts` during this feature; that change was reverted.

**Not included:** every other phase of `context/plans/user-management-plan.md` — the `/me` dashboard
reads, profile settings, the security tab, 2FA, and all frontend work.

### 4. User Management Phase 2 — Dashboard Reads — completed 2026-09-08

The signed-in user's own dashboard surface, modelled on Medium's. Two private endpoints on the
existing `UsersController`, both `@Roles(['user'])` with identity taken from `@Session()`. No
`@AllowAnonymous()`, and neither accepts a user identifier from the client.

**Implemented**

- `GET /api/users/me` — `UsersService.getCurrentLoggedInUser()`. Returns the `session` and `user`
  objects as better-auth built them, plus `isPro` and a presigned avatar URL.
- `GET /api/users/me/blogs` — `UsersService.getMyBlogs()`. The caller's own blogs, drafts included,
  offset-paginated, filterable and sortable.
- `GetCurrentLoggedInUser`, `CurrentUser`, `CurrentSession` and `GetMyBlogs` in
  `packages/types/src/users.ts`.
- 20 Jest tests added to `users.service.spec.ts`. Suite is 63 passing.

**Decisions worth remembering**

- **The `me` routes must be declared above `:username`.** Nest matches in declaration order, so a
  `:username` declared first swallows `/api/users/me` and answers 404 for the very common case of no
  account being named "me". A comment in the controller says so; do not reorder the handlers.
- **`getCurrentLoggedInUser` does no database read.** The global `AuthGuard` has already resolved
  the session, so re-querying it would be a second read of data already in hand. A test asserts
  `prisma.user.findUnique` is never called.
- **Its return type is derived from `UserSession`, not from `@repo/types`.** `Promise<UserSession &
  { user: { isPro: boolean } }>` is the type the guard actually hands over, so the response cannot
  drift from it — the compiler enforces "return the session objects intact" rather than a comment
  doing it. `GetCurrentLoggedInUser` in `packages/types` mirrors the same shape by hand for the
  Next.js app. **Keep the two in step manually.**
- **`packages/types` stays dependency-free.** Importing better-auth's own `Session` and `User` was
  tried and rejected: it would mean adding `better-auth` to a package that has no dependencies, and
  `apps/web` does not even depend on `@repo/types` yet. The hand-written mirror is the deliberate
  trade.
- **Drafts are included in `/me/blogs`, and `isPublished` is returned.** The spec constrains
  ownership, not publish state, and these are the caller's own blogs — matching the plan's Phase 2
  note. This is the one difference from the public profile's `select`, which forces `isPublished:
  true`.
- **The `where` clause is scoped by `authorId: user.id`**, not by `author: { name }`. The public
  endpoint scopes by name because it resolves a username from the URL; here the session carries the
  id directly. Both `findMany` and `count` share one `blogsWhere` object, and a test asserts they
  match so a filter can never be applied to one and not the other.
- **`buildBlogQuery`'s `queryFilter` is unused, again.** Only `querySort`, `pageValue` and
  `limitValue` are destructured; `buildUserBlogsFilter()` (added in history #3 for exactly this)
  builds the title/content filter. Its `author.name` clause would return every one of the caller's
  blogs whenever the search term matched their own username.
- **`/api/users/me` returns `session.token`.** Deliberate and reviewed: the spec asks for the
  complete session object, and this is the caller's own token, which they already hold as a cookie —
  better-auth's `/api/auth/get-session` returns it too. **This does not license the same in Phase 4:**
  `GET /api/users/me/security/sessions` lists *other* sessions, and the plan's "Never `token`"
  rule (`user-management-plan.md:139`, acceptance check at `:301`) still stands there.
- **`isPro` is hardcoded `true`.** No subscription model exists. Replace `PLACEHOLDER_IS_PRO` in
  `users.service.ts` when subscriptions land — the same situation as
  `PLACEHOLDER_TOTAL_SUBSCRIBERS` in `admin.service.ts`.
- **`satisfies Prisma.BlogSelect`, never a type annotation** — same reason as history #2 and #3.

**Verified**

- `pnpm turbo build` green for both `backend` and `web`; `eslint src/users/**/*.ts` clean.
- `tsc --noEmit` reports nothing for the new code. The two pre-existing `admin.service.spec.ts`
  `BlogQueryDto` errors noted in history #3 are still there, untouched.
- `pnpm test` — 63 passing (43 before, 20 added).
- **Not verified:** live responses. The `@Roles(['user'])` rejection, the `me`-before-`:username`
  ordering and an authenticated body were not exercised with `curl` — the app was not booted.
  Behaviour rests on the unit tests plus the declared return types. The route-ordering trap in
  particular is only covered by reading, so exercise `/api/users/me` first when the frontend lands.

**Not included:** `/api/users/me/comments`, `/bookmarks` and `/likes` from the plan's Phase 2 table —
the spec scoped this feature to the profile and blogs only. Also no `status` filter
(`all | published | draft`) on `/me/blogs`, no dashboard UI, and every later phase.

### 5. User Management Phase 3 — Comments, Likes & Bookmarks — completed 2026-09-09

The last three dashboard reads from the plan's Phase 2 table, finishing the private `/api/users/me/*`
surface. All `@Roles(['user'])`, identity from `@Session()`, no caller-supplied identifier in any
`where` clause.

**Implemented**

- `GET /api/users/me/comments` — `UsersService.getMyComments()`. Cursor-paginated, newest first, no
  filter or sort. Reuses `CommentQueryDto`.
- `GET /api/users/me/likes` and `GET /api/users/me/bookmarks` —
  `UsersService.getMyLikes/getMyBookmarks()`. Offset-paginated, newest saved first.
- `LikesAndBookmarksQueryDto` in `apps/backend/src/users/dto/` — `page` and `limit` only, shared by
  both tabs.
- `likesAndBookmarksSelect`, `buildLikesAndBookmarksFilter`, `likesAndBookmarksOrder` and
  `buildLikesAndBookmarksPage` in `users/utils/user-query.ts`.
- `UsersService.presignBlogCards()` — one private helper signing both S3 keys (cover image and author
  avatar) for either endpoint.
- `GetMyComments`, `LikesAndBookmarksBlogCard` and `GetMyLikesAndBookmarks` in
  `packages/types/src/users.ts`.
- 35 Jest tests added to `users.service.spec.ts`. Suite is 98 passing.

**Decisions worth remembering**

- **Likes and bookmarks are paginated, against the spec as written.** The spec said no pagination at
  all; an unbounded list gets slower without limit, so both take `page` and `limit` (default page 1
  of 10) and return `totalPages`. `context/specs/user-management-phase-3.md` was updated — but
  `context/specs` is gitignored (`.gitignore:41`), so **that edit exists only locally**, the same
  situation as `prisma/seed.ts` in history #2.
- **Offset, not cursor, for likes and bookmarks.** The plan specified cursor for both. Offset was
  chosen to match `/me/blogs`, since the tabs are a numbered pager rather than infinite scroll. The
  plan's note about cursoring on the join-row id rather than the blog id is therefore moot, but its
  reasoning still holds for the ordering, which is by when the row was saved.
- **An unpublished blog is filtered out, not flagged.** The plan suggested returning `isPublished` so
  the frontend could grey the card out; the decision was to drop the row server-side instead, so
  `isPublished` is absent from `LikesAndBookmarksBlogCard` and every row is safe to link to.
- **The comments feed carries no blog context.** `select` is `id`, `content`, `createdAt` only, per
  the spec's explicit field list. This was flagged twice during the feature: the Comments tab can
  render a card but cannot link it to the blog it belongs to, and the admin feed selects
  `blog: { id, title, slug }` for exactly that reason. **Revisit when the tab is built.**
- **The comment author is taken from the session, not the row.** Every comment is the caller's own,
  so `author` is built once from `session.user` and the avatar is signed once rather than per row.
  A test asserts `getSignedUrl` is called exactly once for a three-row page.
- **`buildBlogQuery` was not reused for the new pagination.** Its `queryFilter` and `querySort` are
  typed against `Blog` and neither applies to a query over `Like` / `Bookmark` join rows. Only the
  two defaults are shared, deliberately kept identical.
- **`satisfies`, never a type annotation** — same reason as history #2, #3 and #4.

**Fixed during review — three ways invalid pagination reached Prisma**

The review found, and execution confirmed, that `@IsNumberString()` accepts `"0"` and `"-1"`:

- `?limit=0` on `/me/comments` made `nextCursor` index `[-1]` on an empty page → `TypeError`, 500.
- `?limit=0` on likes/bookmarks made `Math.ceil(n / 0)` → `Infinity` → `totalPages: null` in JSON.
- `?page=0` produced `skip: -10`, which Prisma rejects.

The fix is at the boundary rather than clamped in the service: `CommentQueryDto` and
`LikesAndBookmarksQueryDto` now use `@Type(() => Number)` + `@IsInt()` + `@Min(1)` on `number`
fields. `@IsInt` also rejects a fractional `limit` (Prisma's `take` refuses one) and the `NaN` a
non-numeric param transforms into. The `comments.length > 0` guard stays as a second line of defence.

- **This changed three pre-existing endpoints.** `CommentQueryDto` is shared, so the public comments
  feed and both admin comment feeds now answer 400 on `?limit=0` where they previously returned an
  empty list. Their `parseInt(limit)` call sites became `limit ?? 10`.
- **`BlogQueryDto` was left alone and still has the same flaw.** It remains `@IsNumberString()`
  strings, so `?page=0` on the blog feed, the public profile and `/me/blogs` still computes a
  negative `skip`. Converting it would touch those three surfaces and was scoped out.
- **Still no upper bound.** `?limit=999999` is accepted on all of these. A `@Max()` is a one-line
  addition whenever that becomes a concern.

**Verified**

- `pnpm turbo build` green for both `backend` and `web`; `eslint` clean on `src/users` and
  `src/comments`.
- `tsc --noEmit` reports nothing new. The two pre-existing `admin.service.spec.ts` `BlogQueryDto`
  errors from history #3 are still there, untouched.
- `pnpm test` — 98 passing (63 before, 35 added).
- The three crashes above were reproduced by executing the service, then re-probed through
  `plainToInstance` + `validate` after the fix: `limit=0`, `limit=-1`, `page=0`, `page=-1` and
  non-numeric values all reject; positive integers transform correctly.
- **Not verified:** live responses and the route mapping. The app was not booted, so
  `@Roles(['user'])` and the `me`-before-`:username` ordering still rest on reading alone — that trap
  is now three routes wider than history #4 left it. Exercise `/api/users/me/*` first when the
  frontend lands.

**Not included:** the dashboard UI and the `date-fns` compact relative-time formatting, which are
frontend work; Phase 3's profile settings (`PUT /api/users/me`, username availability) and every
later phase.

### 6. Update User Profile — completed 2026-09-10

The first write endpoint on the user surface, and the first half of the plan's Phase 3.
`PUT /api/users/me` lets a signed-in user update their own `name`, `bio`, `website` and avatar.
`@Roles(['user'])`, identity from `@Session()`, no caller-supplied identifier in any `where` clause.

**Implemented**

- `PUT /api/users/me` on the existing `UsersController` — multipart, `FileInterceptor('image')`,
  with `ParseFilePipe` (`fileIsRequired: false`, `MaxFileSizeValidator` at 1 MB, `FileTypeValidator`
  on `image/(png|jpeg|jpg|avif)`).
- `UsersService.updateUserProfile()` — reads the row, checks the name, uploads, updates, then
  deletes the superseded S3 object.
- `UpdateUserProfileDto extends UpdateAdminDto` in `users/dto/update-user-profile-dto.ts`. It adds
  no fields, which is what keeps `role` and every other column unwritable.
- `UpdateUserProfile` in `packages/types/src/users.ts` as a `Pick` off `CurrentUser`.
- `bio` and `website` declared as `user.additionalFields` in `apps/backend/lib/auth.ts`, so
  better-auth carries them on the session user, and added to `CurrentUser`.
- Empty-string clearing on `bio` and `website` — see below.
- 26 tests: 16 in `users.service.spec.ts` and a new `admin/users/dto/update-user-dto.spec.ts` (10).
  Suite is 124 passing.

**Decisions worth remembering**

- **The write response returns the stored S3 key, not a presigned URL.** Signing is the read path's
  job; a write response reports what was persisted. `updateAdmin()` already did this. An earlier
  draft presigned `image` here and was corrected.
- **Empty string clears a field, and the transform lives on the DTO.** `@Transform(emptyStringToNull)`
  on `bio` and `website` maps `''` to `null` before validation, so `@IsOptional()` short-circuits and
  Prisma writes `NULL`. **Omitted stays `undefined` and empty becomes `null`** — Prisma skips the
  first and writes the second, so "leave alone" and "clear" stay distinct operations. Before this,
  `@IsOptional()` only skipped `null`/`undefined`, so `bio: ''` hit `@MinLength(10)` and a user could
  never remove a bio once set. **This changed `UpdateUserDto`, the shared base**, so
  `PUT /api/admin/settings` and `PUT /api/admin/users/:username` accept `''` to clear as well.
- **The old avatar key comes from the row, not the session.** `updateAdmin()` reads `user.image` off
  the session, which goes stale after an earlier update and would delete the wrong object. This
  endpoint reads `{ id, name, image }` first and deletes based on that.
- **A failed S3 delete does not fail the request.** The row is already updated at that point, so
  throwing would report a failure that did not happen. It is logged and leaves an unreferenced
  object behind.
- **`name` keeps `@MaxLength(50)`, which still contradicts sign-up.** `databaseHooks.user.create.before`
  in `lib/auth.ts` caps names at 20. `user-management-plan.md:119` wanted 3–20 here; the spec asked
  for `UpdateAdminDto`'s rules to be inherited unchanged, so the divergence stands. **Revisit.**
- **`FileTypeValidator` checks magic numbers, not the mimetype.** Nest 11 inspects the buffer with
  `file-type` (resolvable from `@nestjs/common` — verified). It matches the *detected* mime, so the
  spec's `jpg` alternative is inert: a `.jpg` is always detected as `image/jpeg`. Stricter than a
  mimetype check, and a file too small to have a signature is rejected since `fallbackToMimetype`
  is off.
- **The DTO cannot be imported as a value in a Jest spec.** It extends `OmitType` from the ESM-only
  `@nestjs/mapped-types` — the same trap as history #1. `users.service.spec.ts` uses
  `import type`; the empty-string rules are therefore tested against `UpdateUserDto`, which is a
  plain class.
- **Extra body fields are not rejected.** The global `ValidationPipe` sets no `whitelist`, so
  `{ role: 'admin' }` survives validation. It cannot reach the database because the service
  destructures only three fields — the guarantee is the destructure, not the DTO.

**Also fixed, both assigned to this phase by the plan**

- **`updateAdmin()` wiped the avatar.** `image: imageKey` unconditionally set `image` to `null`
  whenever the settings form was saved without picking a file. Now `imageKey ?? user.image`
  (`user-management-plan.md:128`). It still reads the key from the session rather than the row, so
  it can act on a stale key; that was left alone.
- **`isUsernameTaken()` moved** from `AdminUsersService` to `UsersService`, which now exports it;
  `AdminModule` imports `UsersModule` and `AdminService` calls it there. It is not admin-specific,
  and having `UsersService` inject `AdminUsersService` would have pointed the dependency the wrong
  way (`user-management-plan.md:248`).
- **Comment density reduced** across `src/users`, `packages/types/src/users.ts`, the admin profile
  `select` and `LastActivityInterceptor`, per a standing instruction: 1–2 sentences per comment, no
  multi-line explanatory blocks. Rationale belongs in this history instead.

**Verified**

- `pnpm turbo build` green for `backend` and `web`; `eslint` clean on every changed file.
- `pnpm test` — 124 passing (98 before, 26 added).
- `tsc --noEmit` reports nothing new. The two pre-existing `admin.service.spec.ts` `BlogQueryDto`
  errors from history #3 are still there, untouched.
- The empty-string rules were executed, not just read: `''` → `null` for both fields, omitted stays
  `undefined`, `name: ''` still rejected, and the length and URL rules still fire on non-empty input.
- `file-type` resolves from inside `@nestjs/common`, so magic-number validation works at runtime.

**Not verified:** anything live. The app was never booted, so route mapping, the `@Roles(['user'])`
rejection, the `me`-before-`:username` ordering, a real multipart upload and the S3 round trip all
rest on unit tests and reading. This is now the sixth feature carrying that gap and the first with a
**write** path in it — exercise `PUT /api/users/me` first when the frontend lands.

**Known gap:** a `P2002` race on `name` (taken between the availability check and the write) answers
500 rather than 400, and orphans the just-uploaded S3 object. Same pattern in `updateAdmin`.

**Not included:** `GET /api/users/me/username-available` from the plan's Phase 3 table, the settings
UI, and everything from Phase 4 on — the security tab, password, email and 2FA, which the spec
defers to Better Auth.

### 7. Rate Limiting — completed 2026-09-11

The first infrastructure-level protection on the API. `@nestjs/throttler@6.5.0` registers one global
throttler and five write routes tighten it. The auth surface is covered separately by Better Auth's
own limiter, because the Nest guard cannot reach it.

**Implemented**

- `ThrottlerModule.forRoot([{ name: 'default', ttl: minutes(1), limit: 60 }])` and
  `{ provide: APP_GUARD, useClass: ThrottlerGuard }` in `app.module.ts`.
- `@Throttle({ default: { ttl: minutes(1), limit: 10 } })` on `POST /api/blogs`,
  `PUT /api/blogs/:slug`, `DELETE /api/blogs/:slug` and `PUT /api/users/me` — every route that
  touches S3.
- `@Throttle({ default: { ttl: minutes(1), limit: 5 } })` on `POST /api/reports/:blogSlug`.
- `rateLimit: { enabled: true, max: 5, window: 60 }` in `lib/auth.ts`, covering `/api/auth/*`.
- `@Max(100)` on `limit` in `BlogQueryDto`, `CommentQueryDto` and `LikesAndBookmarksQueryDto`.
- `BlogQueryDto` converted from `@IsNumberString()` strings to `@Type(() => Number)` + `@IsInt()` +
  `@Min(1)` numbers, closing the `?page=0` negative-`skip` hole flagged in history #5. Six string
  fixtures in `users.service.spec.ts` were updated to numbers to match the new types.

**Decisions worth remembering**

- **`ttl` is milliseconds in `@nestjs/throttler` (v5+), seconds in Better Auth.** The two configs
  look alike and mean different things. `seconds()` / `minutes()` helpers are used on the Nest side
  so the unit is unambiguous. A bare `ttl: 60` would be a 60ms window — no rate limit at all.
- **Counters are per route handler, per throttler, per IP.** `generateKey` hashes
  `` `${class}-${handler}-${name}` `` with the caller's IP, so a limit of 60 means "60 calls to
  *this one endpoint*". The dashboard's five parallel `/me/*` calls are five counters of 1, not one
  counter of 5. An early draft sized the limits as if they were shared and was corrected.
- **Every registered throttler runs on every request; `@Throttle` overrides, it does not select.**
  `canActivate` loops `for (const namedThrottler of this.throttlers)` and returns
  `continues.every(...)`. The override is keyed by throttler *name*, so the object key must match a
  registered name — `@Throttle({ name: 'default' })` writes metadata nobody reads and is a **silent
  no-op**. Excluding a tier needs `@SkipThrottle({ <name>: true })`. A three-tier
  `short`/`medium`/`long` ladder was built and then dropped for the single throttler; the tiers are
  *not* route categories, which is the trap the docs' example invites.
- **Generous global, restrictive overrides.** The global applies to reads too, so it must clear the
  busiest legitimate browsing. A global of 5 or 10/min would 429 ordinary use — eleven feed pages in
  a minute is eleven hits on one endpoint — and would force a *loosening* `@Throttle` onto nearly
  every `GET`. Keeping the global at 60 means the common case needs no decorator.
- **Limits are sized at 3–5× the busiest realistic human, not at what users "should" do.** A spam
  script trips any of these within seconds, so the difference between 5 and 20 barely affects an
  attacker — it only decides how often a real user is punished. When unsure, the looser number wins.
- **`DELETE /api/blogs/:slug` is 10/min, same as create.** Delete is the *fastest* of the three to
  repeat — one click from a list, versus writing a post and uploading an image — so if anything it
  needs a higher limit than create, not a lower one. Setting it to 5 would have made the one action
  users do in quick succession the most likely to 429.
- **Admin writes were deliberately left on the global.** The threat is a compromised admin session,
  and a rate limit is a weak control there — an attacker with admin rights does the damage in five
  requests. Bulk moderation is legitimately high-rate, so tightening only obstructs real work.
- **`/api/users/me` is the session-check endpoint, so better-auth's `max: 5` does not govern it.**
  It is a Nest route on the 60/min global, and the session it returns is resolved server-side via
  `auth.api.getSession()`, which Better Auth exempts from rate limiting. A `customRules` carve-out
  for `/get-session` is only needed if `authClient.useSession()` is adopted on the web app.
- **Better Auth's built-in path rules survive the global.** `/sign-in/email` stays at 3 per 10s from
  better-auth regardless of `max: 5`, because a path's own rule replaces the default.
- **`@Max(100)` matters more than the throttler on those endpoints.** `?limit=1000000000` was a
  single *allowed* request that reached Prisma as `take` and presigned an S3 URL per row; the
  throttler happily permits 60 of those a minute.

**Verified**

- `pnpm turbo build` green for `backend` and `web`; `pnpm test` — 124 passing; `eslint` clean on
  every changed file.
- `tsc --noEmit` reports nothing new. The two pre-existing `admin.service.spec.ts` `BlogQueryDto`
  errors from history #3 are still there, untouched — they now also carry a string/number mismatch.
- The DTO rules were executed, not read: `page=0`, `page=-1`, `limit=0`, `limit=-5`, `page=abc`,
  `limit=1.5` and empty strings all reject; `limit=101`, `999999` and `1000000000` reject on all
  three DTOs; `limit=100` and `page=1&limit=10` transform to numbers correctly.
- **Live-verified for the first time in seven features.** `POST /api/blogs` was temporarily set to
  `limit: 1` and exercised in Postman: the second call in the window returned 429. This is the first
  feature in this history with a confirmed live request/response.

**Known gaps — all deployment-blocking, none addressed**

- **`trust proxy` is not set.** Behind any reverse proxy every request carries the proxy's IP, so
  all users share one counter and the 61st request from anyone 429s everyone. Rate limiting would
  take the site down rather than protect it. Needs the real topology to set safely, and Better Auth
  needs the matching `ipAddressHeaders` / `trustedProxies`.
- **Both limiters store counters in memory.** They reset on every deploy and do not work across
  instances. The Nest side needs a Redis `ThrottlerStorage`; Better Auth supports
  `storage: "database"` with a `rateLimit` model and migration.
- **`enabled: true` turns Better Auth's limiter on in development**, which is off by default there.

**Not included:** likes, bookmarks, comments and admin writes keep the global; a second
narrow-window throttler to catch bursts; and any frontend handling of 429 responses.

### 8. Backend Audit Fixes — completed 2026-09-11

Not a feature. A `backend-auditor` subagent reviewed `apps/backend` end to end and reported one
exploitable IDOR plus a set of contract warts that would be expensive to find after the web app was
built against them. This branch closes the ones that block frontend work.

**Implemented**

- **Mass assignment closed, two layers.** `ValidationPipe` in `src/main.ts` gained
  `whitelist: true` and `forbidNonWhitelisted: true`; `BlogsService.updateBlog` now destructures
  `{ title, content, tags, isPublished }` instead of spreading the raw DTO into Prisma's `data`.
- `GET /api/users/me/blogs/:slug` — `UsersService.getMyBlogBySlug()`, `@Roles(['user'])`, `where`
  scoped `{ slug, authorId: user.id }`. `GetMyBlogBySlug` added to `packages/types/src/users.ts`.
- `CreateBlogDto.isPublished` gained the string→boolean `@Transform` it never had;
  `UpdateBlogDto`'s transform gained its missing `return value` fallback.
- `ReportQueryDto.page` / `limit` converted to `@Type(() => Number)` + `@IsInt()` + `@Min(1)`, with
  `@Max(100)` on `limit`.
- `getAllUsersAsAdmin` defaults to page 1 of 10; `totalPages` derives from the real limit.
- `author.image` is presigned in `getAllBlogs` and in all three `CommentsService` paths.
  `CommentsService` now injects `S3ServiceService`; `CommentsModule` imports `S3ServiceModule`.
- `getBlogBySlug` no longer selects `author.image` at all — the detail page does not render one.
- `getCommentsForBlog`'s `nextCursor` is now `comments.length === take ? ... : null`.
- `GetAllBlogsResponse` gained `isReportedByLoggedInUser`; `GetBlogBySlugResponse.author` narrowed
  to `Pick<BlogAuthor, 'id' | 'name'>`.
- 38 tests added (124 → 162): `report-query-dto.spec.ts`, `blogs/dto/update-blog-dto.spec.ts`, and a
  `getMyBlogBySlug` block in `users.service.spec.ts`.

**Decisions worth remembering**

- **The draft read went in `users`, not `blogs`.** `GET /api/blogs/:slug` is `@AllowAnonymous()` and
  hardcodes `isPublished: true`; adding an `?includeDrafts` branch would have made a public endpoint
  conditionally private, which is the shape that leaks. Writes stayed in `blogs` — they have no
  anonymous path, so there is nothing to separate, and splitting blog CRUD across two modules would
  have no rule behind it. **Consequence:** the editor reads from `/api/users/me/blogs/:slug` and
  writes to `/api/blogs/:slug`. If that asymmetry becomes annoying, move the read to
  `GET /api/blogs/:slug/draft` — do not relax the public endpoint.
- **`@Type(() => Boolean)` cannot replace the `@Transform`, and this was proven by execution.** It is
  `!!value`, so the string `'false'` coerces to `true` and unpublishing becomes impossible;
  `'yes'` silently publishes instead of returning 400. `@Type(() => Number)` is safe on the query
  DTOs for the opposite reason: `Number('abc')` is `NaN` and `@IsInt()` catches it. `Boolean()` can
  never fail, so bad input is undetectable.
- **`whitelist` keys off decorators, not declared fields.** A property declared on a DTO with no
  class-validator decorator is stripped silently. All 16 DTOs were swept before the flag went on —
  every field carries at least one decorator.
- **`forbidNonWhitelisted` had to land before the frontend, not after.** It turns previously-ignored
  extra fields into hard 400s, so enabling it later would break a client already sending one.
- **A DTO is a rule list, not a shape.** `plainToInstance` iterates the *body's* keys, so
  `authorId` landed on the instance and validation never looked at it — zero errors does not mean
  the object matches the DTO. That is why every other service destructures; history #6 already wrote
  the rule down ("the guarantee is the destructure, not the DTO") and `blogs.service.ts` was the one
  place it was never applied.
- **Finding 13 (admins 403 on `/api/users/me`) was a false positive.** `/api/admin/me`,
  `/api/admin/me/blogs`, `/api/admin/me/comments` and `PUT /api/admin/settings` are the admin's
  parallel dashboard, so the guard is stopping a duplicate, not locking anyone out. Admins writing
  through `/api/blogs` with no `@Roles` is correct: `/api/admin/me/blogs` exists to list those blogs.
- **Response envelope decided: bare bodies everywhere.** `POST`/`PUT /api/blogs` are the only two
  endpoints returning `{ success, data }`. **Not yet applied** — see gaps.

**Verified**

- `pnpm turbo build` green for `backend` and `web`; `pnpm test` 162 passing; `eslint` clean on every
  changed file.
- `tsc --noEmit` reports nothing new. The two pre-existing `admin.service.spec.ts` `BlogQueryDto`
  errors from history #3 are still there, untouched.
- The mass assignment is pinned by a test that runs the **real `ValidationPipe`**: an unguarded pipe
  copies `authorId` onto the instance and carries it through a spread; the guarded one answers
  `property authorId should not exist`.
- **Live-verified in Postman:** `POST /api/blogs` and `PUT /api/blogs/:slug` both publish correctly
  after the transform fix. A long debugging detour on the `PUT` turned out to be a malformed
  request — the body sent `isPublished` twice, which Express and multer collect into an array
  (`[true, true]`), and `@IsBoolean()` correctly rejected it. The code was right the whole time.
  **The identical transform on both DTOs is what proved it:** same code, `POST` worked, so the
  difference had to be the request.
- **Not verified:** the app was not booted from this session, so route mapping for
  `GET /api/users/me/blogs/:slug` and its `@Roles(['user'])` rejection still rest on reading. Same
  gap as the last six features — exercise it first when the editor lands.

**Known gaps — all still open**

- **`GET /api/users/me` still returns `session.token`** (audit finding 14). Deliberate per history
  #4, but it voids the httpOnly cookie the moment there is any XSS. Drop it before SSR code starts
  reading it.
- **The `{ success, data }` envelope is still on `POST`/`PUT /api/blogs`** despite the decision above.
- `admin-reports.service.ts` still returns raw S3 keys for `user.image` and `blog.author.image`.
- `admin-blog-query-dto.ts` and `admin/users/user-query-dto.ts` still have no `@Max` on `limit`
  (audit finding 8) and `admin-blog-query-dto` uses `@IsNumber()` without `@IsInt()`, so
  `limit=1.5` still reaches Prisma.
- Admins can like and bookmark but have no `/api/admin/me/likes` or `/bookmarks` to list them.

**Not included:** every other audit finding — the missing indexes on the hottest queries (the comment
feed still sequential-scans on `blogId`), the like/bookmark/report check-then-insert races that 500
on a double click, S3 failures turning successful deletes into 500s, drafts being commentable and
likeable by slug, and the whole test backfill for `blogs`/`likes`/`bookmarks`/`reports`.

### 9. Authentication Phase 1 — Login & Sign Up — completed 2026-09-13

The first frontend feature in this history, and the first UI in `apps/web` beyond a placeholder home
page. `/login` and `/sign-up` in an `app/(auth)/` route group, each offering credentials and OAuth
(Google, GitHub).

**Implemented**

- `app/(auth)/layout.tsx` — two-column grid: form panel left, marketing heading plus the unDraw SVG
  right (hidden below `lg`). It nests inside the root layout rather than replacing it.
- `app/(auth)/login/page.tsx` and `sign-up/page.tsx` — both `async`, both read `searchParams`, both
  declare `title` + `description`. Next reports them as `ƒ (Dynamic)`.
- `app/(auth)/_components/auth-header.tsx` — server component holding the logo and the cross-route
  nav link (shadcn-studio Button 16, arrow flipped right, hover-translate preserved).
- `app/(auth)/_components/oauth-button.tsx` — one `provider`-driven client component, and
  `oauth-providers.tsx` pairing both buttons with the `Marker variant='separator'` OR rule.
- `login/_components/login-form.tsx` and `sign-up/_components/sign-up-form.tsx` — react-hook-form +
  `zodResolver` + shadcn `Field`, per the official docs pattern.
- `schema/auth.ts` — `passwordSchema`, `signUpSchema` (with the `confirmPassword` refine) and
  `loginSchema`.
- `lib/absolute-url.ts` — `toAbsoluteUrl` and `toSafeCallbackUrl`.
- shadcn `field`, `input`, `label`, `sonner`, `marker`, `separator`, `spinner` installed;
  `@hookform/resolvers` added. `<Toaster />` mounted in the root layout, and its `bg-black` dropped.
- `--app` / `--app-from` / `--app-to` brand tokens in `globals.css`, sampled from the app icon.
- `socialProviders` (GitHub, Google) added to `apps/backend/lib/auth.ts`.

**Decisions worth remembering**

- **A route-group layout cannot escape the root layout, and layouts get no `searchParams`.** Both
  shaped the structure. The spec's "doesn't inherit from the root layout" was read as "owns its own
  visual shell" — true isolation needs multiple root layouts and duplicated metadata, which was
  rejected. Because the layout cannot read `searchParams`, the header could not live there and stay
  server-rendered, so `AuthHeader` is a server component each **page** renders with `mode` and
  `callbackUrl` as props. The alternative — a `'use client'` nav button on `usePathname` +
  `useSearchParams` behind a Suspense boundary — was considered and dropped.
- **`callbackURL` handed to `authClient` must be absolute.** Better Auth resolves a relative one
  against its own `baseURL`, which is the backend, so `/` sent users to the API host after
  verifying their email. `toAbsoluteUrl` expands it against `NEXT_PUBLIC_SITE_URL`.
- **The fix was built in the backend first, then moved to the frontend on request.** A
  `withFrontendCallback` helper rewrote the `callbackURL` param inside `sendVerificationEmail` and
  `sendResetPassword`, which covered every trigger in one place. It was reverted in favour of the
  frontend passing absolute URLs. **The trade this accepts:** `sendResetPassword` and any future
  server-initiated email are no longer covered, so each new caller has to remember. Verified in the
  1.6.26 source that no `emailVerification.callbackURL` config option exists — rewriting is the only
  route.
- **On `signIn.email`, `callbackURL` does two unrelated jobs**, which is why `LoginForm` takes two
  props. `sign-in.mjs:316` feeds it into the verification email, while `:335` sets the post-login
  `Location`. `verifyRedirectUrl` is absolute and always `/login`; `callbackUrl` stays **relative**
  so `router.push` soft-navigates. Collapsing them breaks one case or the other.
- **Open redirect found in review and fixed.** `router.push(callbackUrl)` took the query param
  unvalidated, so `?callbackUrl=https://evil.com` bounced users off-site straight after a successful
  login. `toSafeCallbackUrl` compares hostnames and returns a **relative** path, so the result is
  same-origin by construction. `new URL(path, base)` does **not** sanitise — an absolute input
  silently ignores the base, which is what made the hole easy to miss.
- **Only `router.push` was exposed.** Every `callbackURL` reaching `authClient` is already validated
  by Better Auth's `originCheckMiddleware` against `trustedOrigins` (403 `INVALID_CALLBACK_URL`), so
  OAuth and the verification email were never at risk. `NEXT_PUBLIC_SITE_URL` and `APP_FRONTEND_URL`
  must therefore stay identical — a mismatch 403s every sign-in.
- **A live test appeared to disprove the open redirect and did not.** `?callbackUrl=https://google.com`
  left the page unchanged, but `navigate-reducer.js:34` routes external URLs to
  `completeHardNavigation` — so `onSuccess` had never run, almost certainly a 403 on an unverified
  account. The guard went in regardless; router internals are not a security boundary.
- **`FieldError` styling was moved off the label.** `Field` carries
  `data-[invalid=true]:text-destructive`, which turned the label red too; `data-invalid` was dropped
  from `Field` so only the input border and the error text signal state.
- **`useTransition`, not a `useState` boolean**, for the OAuth pending state — no manual reset on
  error paths.
- **Sign-up follows the spec's schema, not the screenshot.** The reference shows First/Last Name and
  a Terms checkbox; the schema has one `name` plus `email`, and nothing stored a terms value.

**Verified**

- `pnpm turbo build` green for `backend` and `web`; `pnpm check-types` and `pnpm lint` clean on both.
- `toSafeCallbackUrl` executed against `https://evil.com/phish`, `//evil.com`, `javascript:alert(1)`
  and `''` — all collapse to `/`; `/blog?page=2#top` keeps its query and hash.
- `toAbsoluteUrl` executed to confirm an absolute input overrides the base — the reason the guard is
  a separate function.
- Better Auth 1.6.26 source read directly for the `callbackURL` default, `originCheckMiddleware`,
  `getIp` and the rate-limiter key, rather than relying on the docs.

**Not verified — the significant gap**

**Nothing was rendered in a browser.** No route loaded, no form submitted, no OAuth round trip, no
verification link clicked, no toast seen. Layout, responsive behaviour and every runtime path rest on
compilation alone. This is the ninth consecutive feature carrying this gap and the first that is
entirely UI. The user did report one manual sign-in attempt, which failed — see the open-redirect
note above.

**Known gaps**

- **`/forgot-password` does not exist.** The login link 404s; deferred to the next phase by decision.
- **`name` allows 50 characters, the backend rejects over 20.** `databaseHooks.user.create.before`
  caps at 20, so a 21–50 character name passes the form and fails at the API with a red toast. Third
  feature to carry this (history #6). **Still unresolved.**
- **`sendResetPassword` still mails a backend-relative `callbackURL`**, so the reset link will land
  users on the API until `/reset-password` exists and passes an absolute URL.
- **Better Auth cannot resolve a client IP**, so rate limiting uses one shared bucket per path.
  `NODE_ENV` is unset, and `getIp` only falls back to `127.0.0.1` when it reads `dev`/`development`.
  Harmless locally, an outage in production — 5 sign-ins per minute across all users. Needs
  `advanced.ipAddress.trustedProxies`/`ipAddressHeaders` plus `app.set('trust proxy', n)` for the
  Nest throttler, both requiring the real deployment topology.
- `--color-app-from` / `--color-app-to` are defined but unused; the logo renders as an image with no
  gradient. Use `bg-linear-to-r` (v4 spelling), not `bg-gradient-to-r`.

**Spec deviations**

- Schema lives at `schema/auth.ts`, not `app/schema/auth.ts`.
- `authClient.signIn.social` has no `onSuccess`/`onError`, against the spec's "every authClient call
  must include both" — dropped by decision since the call redirects away.
- `context/screenshots` was added to `.gitignore`, so the design reference the spec points at is not
  in the repo — the same situation as `context/specs`.

**Not included:** `/forgot-password` and `/reset-password`, email-verification UI, 2FA, the session
and security tabs, and any authenticated surface behind these routes.

### 10. Authentication — Small Features — completed 2026-09-13

Two auth edge cases, plus the TanStack Query foundation the rest of the frontend will be built on.
The query setup is the durable half: it is configured for App Router SSR prefetching now so the
blogs feed can prefetch server-side for SEO and hydrate into a client `useQuery` for filtering,
without retrofitting later.

**Implemented**

- `lib/get-query-client.ts` — fresh `QueryClient` per request on the server, singleton in the
  browser, `staleTime: 60s`, and `shouldDehydrateQuery` widened to include pending queries so an
  in-flight prefetch streams instead of being dropped.
- `app/providers.tsx` — `QueryClientProvider` plus the `Toaster`, mounted once from the root layout.
- `lib/actions/user/getCurrentLoggedInUser.ts` and `lib/actions/user/isUsernameTaken.ts`.
- `hooks/user.ts` — `useIsUsernameTaken`, disabled outside 3–50 characters, `retry: false`.
- `GET /api/users/username-taken?username=` on `UsersController`, `@AllowAnonymous()`, delegating to
  the existing `UsersService.isUsernameTaken`. `UsernameQueryDto` validates 3–50 characters.
- Sign-up name field rebuilt on shadcn `InputGroup` with an `InputGroupAddon align='inline-end'`:
  `Spinner` while checking, emerald `FaCheck` when available, red `FaXmark` when taken, plus the
  error line and a disabled submit. Debounced 400ms via `use-debounce`, value lifted out of the
  `Controller` with `useWatch`.
- Redirect guard on `/login` and `/sign-up` — call the action, `redirect('/')` when a session exists.
- Sign-up uniqueness now enforced server-side in `databaseHooks.user.create.before`.
- `@tanstack/react-query`, `use-debounce` and `@repo/types` added to `apps/web`; `input-group`
  installed; `NEXT_PUBLIC_API_URL` + `API_URL` constant added.
- 13 tests: `username-query-dto.spec.ts` (9) and an `isUsernameTaken` block in
  `users.service.spec.ts` (4). Suite is 175 passing.

**Decisions worth remembering**

- **`credentials: 'include'` does nothing in a Server Component, and this was proven by execution.**
  A local server was booted and hit twice from Node: with `credentials` alone the request arrived
  with **no `Cookie` header at all**; with the header forwarded it arrived intact. Node's fetch has
  no cookie jar, so `credentials` is a browser-only instruction. Every server-side action must send
  `headers: { Cookie: (await cookies()).toString() }` or the endpoint answers 401 for **every**
  user and the guard silently never fires. Better Auth's own FAQ says the same thing for
  `auth.api.getSession`. Client-side calls need only `credentials`.
- **Only `Cookie` is forwarded, not the whole header set.** The docs' `headers: await headers()`
  works because their example calls `auth.api.getSession` in-process; ours is a real cross-origin
  call to Nest, where forwarding `host`, `connection` and `content-length` from the Next request
  can corrupt it.
- **`cookies()` returns `ReadonlyRequestCookies`, not a string** — `.toString()` is required and
  `tsc` rejects the object outright. Confirmed by running `check-types`, not by reading.
- **The route is `username-taken`, not the plan's `username-available`.** Route name, service name
  and boolean polarity then all agree — `true` means taken everywhere, so there is no inversion to
  get wrong. The plan also put it under `/me/`, which is authenticated and therefore useless to a
  visitor who is signing up.
- **`username-taken` must stay above `:username`** — the same declaration-order trap as the `me`
  routes in history #4, now four routes wide.
- **The sign-up hook's uniqueness check was case-sensitive and the live check is not.** Left as
  written, `ahmed` existing would make the form say `Ahmed` was taken while the hook accepted it —
  the UI stricter than the server. Now `findFirst` + `mode: 'insensitive'`, matching
  `isUsernameTaken`, and a test pins it. The length checks were also moved ahead of the query so a
  1-character name costs no database read.
- **The live check is advisory, not a guarantee.** It is debounced and racy by nature; the hook is
  the real constraint. That is the reason it was worth fixing rather than deleting.
- **Available is signalled by the check mark alone; the border stays neutral.** A green border
  would fight the focus ring exactly where the cursor is, reward the expected outcome, and add a
  success colour used nowhere else. Only the taken state colours the border.
- **`input-group.tsx` ships stock `ring-3`; changed to `ring-1`** to match the edit already made to
  `input.tsx`, otherwise the grouped field's ring is visibly heavier than every other input.
- **One `lib/` at the web root, not `app/lib/`.** The spec asked for `app/lib/` and `app/hooks/`,
  but `apps/web/lib/` already existed and two `lib` folders leave no obvious home for new code.
  The spec file was updated to match.
- **Query keys are inline, and `['users', ...]` is reserved.** The availability check uses
  `['username-taken', name]` so the admin user-filtering list can own the `users` prefix and
  invalidate it broadly without clearing this cache.
- **`useWatch`, not `form.watch()`** — hooks cannot be called inside a `Controller` render prop, so
  the value is lifted into the component body; `useWatch` also keeps re-renders local once fields
  are split into subcomponents.
- **The action returns `GetCurrentLoggedInUser | null`, against the spec's table.** A 401 cannot
  produce a `GetCurrentLoggedInUser`, and `null` is what the guard branches on.
- **`apps/web` had no `@repo/types`**, exactly as history #4 recorded; added as `workspace:*`.

**Verified**

- `pnpm turbo build` green for `backend` and `web`; `/login` and `/sign-up` still `ƒ (Dynamic)`.
- `pnpm check-types` and `pnpm lint` clean on `web`; `eslint` clean on `src/users` and `lib/auth.ts`.
- `tsc --noEmit` reports nothing new — the two `admin.service.spec.ts` `BlogQueryDto` errors from
  history #3 are still there, untouched.
- `pnpm test` — 175 passing (162 before, 13 added).
- The Node cookie behaviour was executed against a throwaway HTTP server, not assumed.
- Better Auth 1.6 documentation consulted directly for the server-side session rule.

**Not verified — the significant gap**

**Nothing was run in a browser or against a booted server.** The route mapping, the
`username-taken`-before-`:username` ordering, the 400 on a short name, the debounce timing, the
spinner/check/X transitions and the redirect itself all rest on compilation and unit tests. A live
boot was offered and declined. This is the tenth consecutive feature carrying this gap, and the
ordering trap is the one thing unit tests cannot cover.

**Known gaps**

- **Admins are not redirected away from the auth routes.** `GET /api/users/me` is `@Roles(['user'])`,
  so an admin receives 403, the action returns `null`, and the guard reads that as logged out. Audit
  finding 13 (history #8) called this correct for the endpoint; it is a real hole for this guard.
  Admins have `/api/admin/me`.
- **`/forgot-password` still does not exist**, so its guard is unwritten — the login link still
  404s. Deferred by decision, third feature carrying it.
- **Username enumeration is open at 60/min per IP** — the global throttle, no `@Throttle` override.
  Inherent to any sign-up availability check, but it compounds the `trust proxy` gap from history
  #7: in production every caller shares one bucket.
- `NEXT_PUBLIC_API_URL` was added to `apps/web/.env`, which is gitignored — it must be set wherever
  this deploys or `API_URL` silently falls back to `localhost:3001`.
- `components/ui/textarea.tsx` was pulled in as a registry dependency of `input-group` and is unused.
- The spec file was updated in four places, but `context/specs` is gitignored (`.gitignore:41`), so
  **those edits exist only locally** — the same situation as history #5.

**Not included:** any actual prefetch + `HydrationBoundary` usage — neither feature has
server-prefetchable data, so the pattern is configured and unused by decision; the `/forgot-password`
route; and any 429 handling on the new endpoint.

### 11. Authentication Phase 2 — Forgot & Reset Password — completed 2026-09-14

The two routes Phase 1 left missing, closing the credentials flow, plus the axios migration that
removes the repeated base URL from `lib/actions`. **The first feature in this history verified in a
real browser** — the previous ten all carried "nothing was rendered in a browser".

**Implemented**

- `lib/axios.ts` — one `axios.create({ baseURL: API_URL, withCredentials: true })` instance.
  Both files in `lib/actions/user/` migrated off `fetch`; no `fetch` remains there.
- `app/(auth)/forgot-password/` — page plus `_components/forgot-password-form.tsx`, calling
  `authClient.requestPasswordReset` with an absolute `redirectTo`.
- `app/(auth)/reset-password/` — page reading `token` from `searchParams` server-side, plus
  `_components/reset-password-form.tsx` and `_components/reset-password-confirmation.tsx`.
- `app/robots.ts` — `disallow: ['/reset-password']`.
- `AuthHeader`'s `mode` / `callbackUrl` made optional, rendering the logo alone when omitted.
- **`@Roles(['user'])` removed from `GET /api/users/me`** — see below.
- No tests added. The feature is frontend-only bar that one guard removal; suite stays at 166.

**Decisions worth remembering**

- **`withCredentials: true`, not an `Authorization` header.** The axios docs' "shared authentication
  headers" example is a Bearer-token pattern and does not apply: the session is an httpOnly cookie
  that JS cannot read, so there is no token to attach. That example also evaluates `getToken()`
  **once at module load**, freezing the value — which is why the docs immediately show
  `instance.defaults.headers.common[...]` as the fix.
- **`withCredentials` is a request-config option, not a header.** An attempt to pass it inside
  `headers` sent a junk `withcredentials: true` header to Nest and did nothing. It belongs on the
  instance.
- **`withCredentials` still does nothing server-side** — history #10's rule is unchanged. Every
  server-side action must forward `headers: { Cookie: (await cookies()).toString() }` by hand;
  proven again here against a throwaway HTTP server, which also confirmed axios joins
  `baseURL` + `/users/me` to `/api/users/me` correctly.
- **axios throws on non-2xx where fetch only set `ok: false`.** `getCurrentLoggedInUser` therefore
  needs a `try/catch`. **This is a silent-failure shape:** the bare `catch` swallows the status, so
  any failure reads as "signed out" and nothing is logged. It cost real time during this feature —
  see the debugging note.
- **`GET /api/users/me` is no longer role-guarded.** It backs the redirect guard on every public
  auth route, and `@Roles(['user'])` made an admin 403, which the guard read as logged out — the
  known gap recorded in history #10. Removing the decorator leaves the global `AuthGuard`, so the
  route is still authenticated-only. **Nothing pins this in a test**, and the endpoint still returns
  `session.token` (history #8's open gap), which it now hands to admins too.
- **The reset-password heading lives in the client form, not the page.** Every other auth page keeps
  its heading server-side, but the success state must replace the heading as well — otherwise
  "Reset Password" sits above "Password Reset Successful".
- **The reset page's guard is `if (error || !token)`.** Better Auth's `/reset-password/:token`
  callback redirects with `?token=` on success and `?error=INVALID_TOKEN` otherwise; read directly
  from `password.mjs:125-128` in the installed source rather than from the docs.
- **`redirectTo` must be absolute**, for the same reason as `callbackURL` in history #9:
  `redirectError`/`redirectCallback` resolve it with `new URL(callbackURL, ctx.baseURL)`, where
  `baseURL` is the backend. It is also `originCheck`ed (`password.mjs:50`), so `NEXT_PUBLIC_SITE_URL`
  must stay identical to `APP_FRONTEND_URL` or every request 403s.
- **Better Auth versions are skewed across the apps** — `apps/backend` is on 1.7.1, `apps/web` on
  1.6.26, both declared `^`. The backend serves the endpoints, so its version governs the redirect
  contract above.

**Verified — live, in a browser**

- `pnpm turbo build` green; `check-types` and `lint` clean on `web`; `pnpm test` 166 passing.
- Route manifest: `/forgot-password` and `/reset-password` are `ƒ (Dynamic)`, `/robots.txt` static
  and serving `Disallow: /reset-password`.
- `/forgot-password` submit → `POST /api/auth/request-password-reset` **200**, form reset, toast
  shown. Request body confirmed as
  `{"email":"…","redirectTo":"http://localhost:3000/reset-password"}` — absolute and pointing at the
  **frontend**, which closes history #9's `sendResetPassword` gap. The 200 (rather than a 403
  `INVALID_CALLBACK_URL`) also proves the `originCheck` passes.
- `/reset-password` with no token → `/login`; with `?error=INVALID_TOKEN` → `/login`; with `?token=`
  → renders the form.
- Mismatched passwords produce "Passwords don't match" and never reach the network.
- A deliberately invalid token → `POST /api/auth/reset-password` **400** and a toast reading
  "Invalid token".
- The confirmation component was rendered by temporarily flipping `useState(true)` (reverted):
  emerald-600 shield at 100×100, green outlined button to `/login` carrying the `group` class, and
  the form correctly unmounted.
- The axios-migrated username check: `GET /api/users/username-taken?username=Ahmed` **200**, taken →
  red X and "That name is already taken", free name → green check. Confirms `params` encoding and
  `baseURL` joining in the browser as well as in Node.

**Not verified**

- **`getCurrentLoggedInUser()` has never run with a real session through axios.** Every browser check
  was signed out, so the authenticated path — the axios migration's main risk, guarding three routes
  behind a `catch` that swallows everything — rests on the isolated Node proof alone.
- **The emailed reset link was never clicked.** `redirectTo` was confirmed to leave correctly and the
  form was confirmed to work given a token, but the join between them — the backend's redirect from
  `:3001` to `:3000?token=` — was not exercised.
- OAuth, and the `/forgot-password` redirect guard for an already-signed-in user.

**A debugging note worth keeping**

A 403 from `/api/users/me` was misdiagnosed at length. The admin/`@Roles(['user'])` cause was
identified first, then **wrongly dismissed** because a Neon query returned `role: 'user'`,
`emailVerified: false` and zero sessions. That database (`crimson-thunder-97981154`) is **not the one
the backend uses** — proven when a reset token generated seconds earlier failed to appear in it.
**Check `DATABASE_URL` before trusting any query against Neon from the MCP.** The bare `catch` in
`getCurrentLoggedInUser` is what hid the status code and made this expensive; it was the 401-vs-403
distinction that finally identified the cause.

**Known gaps**

- `GET /api/users/me` still returns `session.token`, now to admins as well.
- The `catch` in `getCurrentLoggedInUser` cannot distinguish 401 from a backend outage — a dead API
  logs every user out silently rather than erroring.
- `context/specs` remains gitignored, so the spec this was built from is not in the repo.

**Not included:** email-verification UI, 2FA, the security and session tabs, change-password while
signed in, and any 429 handling on the two new auth calls.
