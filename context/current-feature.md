<!-- Feature Title -->

<!-- Feature Description -->

<!-- Feature Notes -->

<!-- Feature Goals-->

<!-- Feature Status -->

## Status

Completed

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
