import { Prisma } from '../../../generated/prisma/client';

/**
 * The `select` for an admin viewing a user's profile, carrying counts only —
 * the blog and comment lists have their own paginated endpoints.
 */
export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  website: true,
  bio: true,
  createdAt: true,
  banned: true,
  banReason: true,
  _count: {
    select: {
      blogs: true,
      comments: true,
      bookmarks: true,
      likes: true,
    },
  },
} satisfies Prisma.UserSelect;
