import { Prisma } from '../../../generated/prisma/client';

/**
 * Shared `select` for the admin-facing user profile, carrying counts only —
 * the blog and comment lists have their own paginated endpoints.
 *
 * `includeModerationData` is false for the self view, which has no ban state
 * to act on.
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
