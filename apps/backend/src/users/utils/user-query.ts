import { Prisma } from '../../generated/prisma/client';
import { visibleAuthorFilter } from '../../blogs/utils/blog-query';

// Search filter for the blogs of a single author: title and content only,
// since the blogs are already scoped to one author.
export const buildUserBlogsFilter = (search?: string): Prisma.BlogWhereInput =>
  search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

// The blog card shown in the dashboard's Likes and Bookmarks tabs, shared by
// both endpoints. `satisfies`, never an annotation, which collapses inference.
export const likesAndBookmarksSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  tags: true,
  coverImage: true,
  createdAt: true,
  authorId: true,
  author: {
    select: {
      name: true,
      image: true,
    },
  },
} satisfies Prisma.BlogSelect;

// Scoped to the caller's own id and to blogs that are still published and not reported by them,
// so no card can link to a page that 404s for them. Structural type: `Like` and `Bookmark` differ.
export const buildLikesAndBookmarksFilter = (userId: string) => ({
  userId,
  blog: {
    isPublished: true,
    ...visibleAuthorFilter,
    // Hidden from the reporter only, matching the feed, trending, search and the blog page.
    report: { none: { userId } },
  },
});

// Newest saved first. The `id` tie-break keeps the order total — `createdAt`
// alone is not unique, so rows could be skipped or repeated across pages.
export const likesAndBookmarksOrder = [
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.LikeOrderByWithRelationInput[];

// Offset pagination for the Likes and Bookmarks tabs, defaulting to page 1 of
// 10. `limitValue` comes back so the caller can divide the total into pages.
export const buildLikesAndBookmarksPage = (page?: number, limit?: number) => {
  const limitValue = limit ?? 10;
  const pageValue = page ?? 1;

  return {
    skip: (pageValue - 1) * limitValue,
    take: limitValue,
    limitValue,
  };
};
