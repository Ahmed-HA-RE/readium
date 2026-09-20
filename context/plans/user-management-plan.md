# User Management — Backend Plan

## Context

Readium has a full moderation surface (`/api/admin/*`) but **no user-facing account surface at all**.
There is no `GET /api/users/me`, no public profile, no settings endpoint, and no way to list a user's
own bookmarks or likes — `POST`/`DELETE` toggles are all that exist for those.
`context/project-overview.md` already lists this as planned work: *"User Management: profile
management — bio, website, avatar; password and account settings; view personal blogs, likes,
comments, bookmarks."*

The goal is a Medium-style account experience: a public profile at `/:username`, a private dashboard
where the signed-in user reads their own blogs, bookmarks, likes and comments, and a settings page
with Profile / Security tabs covering name, avatar, password, linked social providers, active
sessions, and 2FA.

This plan covers the **backend only**. The frontend is sketched in the last section for reference and
will be built later, in shaa Allah.

---

## Key features

- **Public profile** — `GET /api/users/:username`, readable without a session, published blogs only.
- **Private dashboard** — `/api/users/me/*` for profile, blogs (including drafts), comments,
  bookmarks and likes.
- **Bookmarks and likes lists** — the first read endpoints for these tables; today only toggles exist.
- **Profile settings** — name (with a live availability check), bio, website, avatar upload to S3.
- **Social account linking** — Google and GitHub wired into better-auth, plus a shaped
  linked-accounts endpoint that never leaks tokens.
- **Session management** — list active devices and revoke one or all others.
- **Password change** — served by better-auth's own route, not reimplemented.
- **Two-factor authentication** — TOTP with backup codes, via the better-auth `twoFactor()` plugin.

---

## Architecture decisions

**A new `src/users/` module, not new params on the admin module.** `context/current-feature.md`
history #2 already recorded that `/api/admin/users/:username` is a moderation surface and was
deliberately not reused for the self view. The same reasoning applies here, and more strongly:
`getAllUsersAsAdmin` hard-filters `role: { equals: 'user' }`, and every admin route is behind
`@Roles(['admin'])`.

**Nested sub-module for security, mirroring `src/admin/`.** `src/admin/` is a controller plus nested
`users/`, `blogs/`, `reports/` sub-modules. `src/users/` follows the same shape with a nested
`security/`, so the account-safety surface stays separate from the profile surface.

**Do not reimplement what better-auth already exposes.** Password change, link-social and
unlink-account are already mounted at `/api/auth/*` by `AuthModule.forRoot({ auth })` and are called
from the frontend through `authClient`. We add our own endpoint only where better-auth's response
shape is wrong for us:

- `listAccounts` returns rows but not "which providers are still available to link" — our
  `GET /api/users/me/security/accounts` returns both.
- `listSessions` returns the full session row **including `token`**. Exposing a live session token to
  the browser is exactly the credential we do not want in a JSON body, so our endpoint selects a safe
  subset and resolves `sessionId → token` server-side before delegating the revoke.

**All routes are authenticated by default.** The global `AuthGuard` from
`@thallesp/nestjs-better-auth` means the two public routes must be explicitly marked
`@AllowAnonymous()`, exactly as `BlogsController.getAllBlogs` does.

**Counts must be filtered on the public profile.** `_count: { blogs: true }` includes drafts. Public
profiles use Prisma's filtered relation count so a reader never learns how many unpublished drafts
someone has:

```ts
_count: { select: { blogs: { where: { isPublished: true } } } }
```

**No schema change before the 2FA phase.** `Like` and `Bookmark` both carry
`@@unique([userId, blogId])`, whose backing index leads with `userId`, so `where: { userId }` on the
new list endpoints is already covered. No new index is needed.

---

## Endpoints

### Phase 1 — Public profile

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/api/users/:username` | `@AllowAnonymous()` | Profile scalars + published-blog counts. No `email`. |
| GET | `/api/users/:username/blogs` | `@AllowAnonymous()` | `isPublished: true` only, offset-paginated. |

- Returns **404 for a banned user**, so a banned account is indistinguishable from a missing one.
- Reuses `buildBlogQuery(search, sort, page, limit)` from
  `apps/backend/src/blogs/utils/blog-query.ts` with `isPublished: true` merged into `queryFilter`.
- The S3 key on `User.image` and `Blog.coverImage` must be swapped for a signed URL before returning,
  the same loop `AdminUsersService.getUserBlogsByUsernameAsAdmin` uses.

### Phase 2 — Dashboard reads

| Method | Path | Pagination | Notes |
|---|---|---|---|
| GET | `/api/users/me` | — | Self profile: adds `email`, `emailVerified`, and `_count` split into `publishedBlogs` / `draftBlogs` plus `comments`, `bookmarks`, `likes`. |
| GET | `/api/users/me/blogs` | offset | Drafts included. New `status` filter: `all` \| `published` \| `draft`. |
| GET | `/api/users/me/comments` | cursor | Reuses `CommentQueryDto`. |
| GET | `/api/users/me/bookmarks` | cursor | **New.** Blog card + author. |
| GET | `/api/users/me/likes` | cursor | **New.** Same shape as bookmarks. |

- Cursor pagination must order by `[{ createdAt: 'desc' }, { id: 'desc' }]` on the join row. History
  #2 records the bug where ordering by `createdAt` alone made a cursor on `id` ambiguous and pages
  skipped or repeated rows — do not repeat it.
- Bookmarks and likes cursor on the **`Bookmark`/`Like` row id**, not the blog id, because the sort
  key is when the user saved it, not when the blog was written.
- A bookmarked or liked blog that has since been unpublished should still be listed for its owner, but
  flagged — return `isPublished` so the frontend can grey it out.

### Phase 3 — Profile settings

| Method | Path | Notes |
|---|---|---|
| PUT | `/api/users/me` | multipart, field `profileImage`. Updates `name`, `bio`, `website`, avatar. |
| GET | `/api/users/me/username-available` | `?username=` — drives the live check on the settings form. |

- `UpdateProfileDto` in `src/users/dto/update-profile-dto.ts`, modelled on
  `src/admin/users/dto/update-user-dto.ts` minus `role`, but with `@MaxLength(20)` on `name` rather
  than 50 — the `databaseHooks.user.create.before` hook in `apps/backend/lib/auth.ts` enforces 3–20 at
  sign-up, and the existing DTO's 50 contradicts it. Align on 3–20 and note the divergence.
- Reuse the case-insensitive `isUsernameTaken()` check. See the refactor note below.
- File validation copies `AdminController.updateAdmin` exactly: `ParseFilePipe` with
  `MaxFileSizeValidator(5MB)` and `FileTypeValidator({ fileType: 'image/(jpg|jpeg|png)' })`.
- Avatar key from `generateImageKey({ userId, fileName })` in `apps/backend/lib/utils.ts`; delete the
  old S3 object **after** the DB update succeeds.

> **Do not copy `AdminService.updateAdmin` line for line.** At
> `apps/backend/src/admin/admin.service.ts:67` it writes `image: imageKey` unconditionally, so saving
> the settings form without picking a new file sets `image` to `null` and wipes the existing avatar.
> `AdminUsersService.updateUser` gets this right with `image: imageKey ?? existingUser.image`. The new
> endpoint must use the `??` form. Fixing the admin one is a one-line change and belongs in this phase.

### Phase 4 — Security tab

| Method | Path | Notes |
|---|---|---|
| GET | `/api/users/me/security/accounts` | `{ linked: [{ providerId, createdAt, isCredential }], available: ['google', 'github'] }`. Never returns `password`, `accessToken`, `refreshToken`, `idToken`. |
| GET | `/api/users/me/security/sessions` | `{ id, ipAddress, userAgent, createdAt, expiresAt, isCurrent }`. **Never `token`.** |
| DELETE | `/api/users/me/security/sessions/:sessionId` | Resolves id → token, then `auth.api.revokeSession`. |
| DELETE | `/api/users/me/security/sessions` | Revokes every session except the current one. |

Served directly by better-auth, no backend code — the frontend calls these via `authClient`:

- `POST /api/auth/change-password` — `{ currentPassword, newPassword, revokeOtherSessions }`.
- `POST /api/auth/link-social`, `POST /api/auth/unlink-account`.

Auth config changes in `apps/backend/lib/auth.ts`:

```ts
socialProviders: {
  google: { clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string },
  github: { clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string },
},
account: {
  accountLinking: { enabled: true, trustedProviders: ['google', 'github'] },
},
```

New env vars in `apps/backend/.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`. Callback URLs are `${BETTER_AUTH_URL}/api/auth/callback/{google,github}`.

Two constraints worth stating before the code is written:

- **`User.name` is the unique username.** Google returns a display name like `"Ahmed Haitham"`, which
  will collide with the 3–20 rule and with existing rows. The `databaseHooks.user.create.before` hook
  must be extended to slugify the incoming name and append a short suffix until it is free, otherwise
  the first OAuth sign-up with a taken or spaced name fails with a raw Prisma unique violation.
- **Unlinking the last credential must be blocked.** better-auth's `unlinkAccount` will happily leave
  an account with no sign-in method. The `available`/`linked` payload should carry enough for the UI
  to disable the button, and the rule should be re-checked server-side.

### Phase 5 — Two-factor authentication

Adds the `twoFactor()` plugin to `apps/backend/lib/auth.ts` and `twoFactorClient()` to
`apps/web/lib/auth-client.ts`. This is last because it changes the **sign-in flow** for everyone: with
2FA on, `signIn.email` stops returning a session and returns `{ twoFactorRedirect: true }` instead.

Schema additions (one `prisma migrate dev`):

```prisma
model TwoFactor {
  id          String @id @default(uuid())
  secret      String
  backupCodes String
  userId      String
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("twoFactor")
}
```

plus `twoFactorEnabled Boolean? @default(false)` on `User`.

Endpoints come from the plugin (`/api/auth/two-factor/*`): `enable`, `disable`, `get-totp-uri`,
`verify-totp`, `generate-backup-codes`, `verify-backup-code`. The only thing we add is exposing
`twoFactorEnabled` on `GET /api/users/me` so the settings tab can render its state.

---

## Files

**New**

```
apps/backend/src/users/
├── users.module.ts
├── users.controller.ts              GET /:username, /:username/blogs, /me/*
├── users.service.ts
├── dto/
│   ├── update-profile-dto.ts
│   ├── user-blog-query-dto.ts       extends BlogQueryDto, adds `status`
│   └── username-query-dto.ts
├── utils/
│   └── user-query.ts                buildPublicUserSelect(), buildSelfUserSelect()
└── security/
    ├── users-security.module.ts
    ├── users-security.controller.ts
    └── users-security.service.ts

packages/types/src/users.ts
```

**Modified**

- `apps/backend/src/app.module.ts` — register `UsersModule`.
- `apps/backend/lib/auth.ts` — social providers, account linking, username collision handling; the
  `twoFactor()` plugin in phase 5.
- `packages/types/index.ts` — `export * from './src/users'`.
- `apps/backend/prisma/schema.prisma` — phase 5 only.
- `apps/backend/src/admin/admin.service.ts` — the `image: imageKey ?? existing` fix.
- `apps/backend/.env` — four OAuth vars.

**Reused, not rewritten**

- `buildBlogQuery` — `apps/backend/src/blogs/utils/blog-query.ts`
- `generateImageKey` — `apps/backend/lib/utils.ts`
- `S3ServiceService.uploadFile` / `getSignedUrl` / `deleteFile` —
  `src/s3-service/s3-service.service.ts`
- `BlogQueryDto`, `CommentQueryDto` — extended rather than duplicated
- `buildAdminUserSelect` — the pattern to copy for the two new select builders, including
  `satisfies Prisma.UserSelect` and **never** a type annotation, which collapses Prisma's literal
  inference

**One contained refactor:** `isUsernameTaken()` currently lives on `AdminUsersService`
(`src/admin/users/admin-users.service.ts:355`) but is not admin-specific. Move it to `UsersService`,
export `UsersService` from `UsersModule`, import `UsersModule` in `AdminModule`, and swap the single
call site in `AdminService.updateAdmin`. If that feels like too much churn for one method, the
fallback is to leave it and have `UsersService` inject `AdminUsersService` — but that points the
dependency the wrong way, so the move is preferred.

---

## Conventions to follow

Taken from `context/coding-standards-monorepo.md` and the existing code:

- Controller methods carry the two-line `// Method` / `// Description` comment block and **no return
  type annotation**. Service methods **always** annotate a return type imported from `@repo/types`.
- Prisma is touched only in services, never in controllers.
- DTOs live in `dto/` with kebab-case filenames and **no `.dto.` segment** (`update-profile-dto.ts`).
- Validation is `class-validator` only. `zod` is a stray dependency and is not used anywhere.
- Every service holds `private logger = new Logger(X.name)`; `logger.verbose` for reads, `logger.log`
  for mutations.
- No response envelope. Return the bare payload (`{ blogs, totalPages }`, `{ data, nextCursor }`),
  matching every existing endpoint.
- Errors are Nest built-ins — `NotFoundException`, `BadRequestException`, `ForbiddenException` — with
  human-readable messages. There is no exception filter.
- Migrations use `prisma migrate dev`, never `db push`. Never touch the Neon **production** branch,
  only development (`CLAUDE.MD`).

Per `context/ai-interaction.md`, each phase is its own `feature/<name>` branch, documented in
`context/current-feature.md` before implementation, merged only after `pnpm run build` passes, and
appended to the numbered History oldest-first on completion. Commits are conventional and never
mention Claude.

---

## Verification

Per phase:

1. `cd apps/backend && pnpm run build` — runs `prisma generate && prisma migrate deploy && nest build`.
2. `npx tsc --noEmit` in `apps/backend` and `pnpm check-types` at the root, so `@repo/types` consumers
   are checked too.
3. `pnpm test` — Jest. **Specs may only import services and utils, never controllers**:
   `@thallesp/nestjs-better-auth` and `@nestjs/mapped-types` are ESM-only and use `import.meta`, which
   Jest cannot load once transpiled to CommonJS. This is recorded in `context/current-feature.md`.
   Mock `DatabaseService` and `S3ServiceService` with hand-rolled `jest.fn()` providers, as
   `admin-users.service.spec.ts` does.
4. `pnpm dev` and read the Nest route table at boot to confirm every route is mapped under the right
   controller prefix.
5. Live checks with `curl`:
   - `GET /api/users/:username` returns 200 with **no `email` field** while unauthenticated.
   - `GET /api/users/me` returns 401 unauthenticated, and an unknown path under `/api/users/me`
     returns 404 — proving the 401 comes from the guard and not a catch-all.
   - A banned user's public profile returns 404.
   - `GET /api/users/me/security/sessions` never contains the string `token`.
   - `PUT /api/users/me` with no file leaves `image` unchanged (the regression guarded above).
6. Phase 4: sign in with Google and with GitHub against a fresh account and against an account whose
   email already exists, and confirm the username collision handling produces a unique `name`.
7. Phase 5: enable TOTP with an authenticator app, sign out, sign back in, and confirm the challenge,
   then confirm a backup code works once and not twice.

Neon MCP tools may be used to inspect the **development** branch schema after each migration.

---

## Frontend plan (deferred)

Recorded now so the API shapes are designed for it, to be built after the backend lands.

**Routes** (`apps/web/app/`)

| Route | Contents |
|---|---|
| `/[username]` | Public profile — header, bio, published blogs. |
| `/me` | Dashboard shell with tabs: Stories, Bookmarks, Likes, Comments. |
| `/me/stories` | Own blogs with a published/draft filter. |
| `/settings` | Tabbed settings, tab in the query string: `?tab=profile\|security\|privacy`. |

**Layers**, per `context/coding-standards-monorepo.md`:

- Server fetchers in `apps/web/lib/server/users.ts`, importing response types from `@repo/types`.
- TanStack Query hooks in `apps/web/hooks/use-*.ts` — `use-profile.ts`, `use-my-bookmarks.ts`, and so
  on.
- Server Actions return the `{ success, data, message }` shape and surface errors as toasts. Note this
  envelope is a **frontend** convention; the API itself returns bare payloads.
- Password change, link-social, unlink-account and all 2FA calls go through `authClient` in
  `apps/web/lib/auth-client.ts`, not through our own fetchers. Add `twoFactorClient()` to its plugin
  list in phase 5.
- Infinite scroll on bookmarks, likes and comments follows the `nextCursor` contract; blogs use
  numbered pages from `totalPages`.

---

## Not included

- **Follows.** There is no `Follow` model and no follower counts anywhere in the schema. A
  Medium-style profile eventually wants them, but adding the model, the endpoints and the feed
  implications is its own feature.
- **Change email.** Deliberately left out of this plan.
- **Self-service account deletion.** Prisma cascades would handle the rows, but every S3 avatar and
  cover image would be orphaned, so it needs its own cleanup design.
- **Set-a-password for OAuth-only users.** Until this exists, a user who signs up with Google has no
  `Account.password` and the Security tab must hide the password form rather than fail on submit.
- **Rate limiting.** Still unimplemented repo-wide and listed as planned in
  `context/project-overview.md`. `GET /api/users/me/username-available` is a public-ish enumeration
  surface and is the endpoint that will want it first.
- **The privacy tab's actual settings.** No privacy flags exist on `User` yet; the tab has nothing to
  store until we decide what is configurable.
- **All frontend work.**

## Reference

- `context/project-overview.md`
- `context/coding-standards-monorepo.md`
- `context/ai-interaction.md`
- `context/current-feature.md`
