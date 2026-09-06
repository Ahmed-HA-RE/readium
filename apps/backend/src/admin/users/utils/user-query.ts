import { Prisma } from '../../../generated/prisma/client';

/**
 * Shared `select` for the admin-facing user profile, used by
 * `GET /api/admin/users/:username` and `GET /api/admin/me`.
 *
 * The profile carries counts only. The blog and comment lists are served by
 * their own paginated endpoints, so each list has exactly one query shape and
 * there is no seam between an embedded first page and page two — which matters
 * for comments, where the cursor would otherwise have to be reconstructed from
 * the embedded rows.
 *
 * `includeModerationData` is false for the self view: an admin looking at their
 * own profile has no ban state to act on.
 */
export const buildAdminUserSelect = (includeModerationData: boolean) =>
  ({
    id: true,
    name: true,
    email: true,
    image: true,
    website: true,
    bio: true,
    createdAt: true,
    banned: includeModerationData,
    banReason: includeModerationData,
    _count: {
      select: {
        blogs: true,
        comments: true,
        bookmarks: true,
        likes: true,
      },
    },
  }) satisfies Prisma.UserSelect;
