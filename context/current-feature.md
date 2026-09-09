<!-- Feature Title -->

<!-- Feature Description -->

<!-- Feature Notes -->

<!-- Feature Goals-->

<!-- Feature Status -->

## Status

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
