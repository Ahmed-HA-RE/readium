import { Prisma } from '../../generated/prisma/client';

/**
 * Search filter for the blogs of a single author.
 *
 * `buildBlogQuery` is not reused for this: its filter also searches
 * `author.name`, which is dead weight here because the blogs are already
 * scoped to one author. Only the title and the content are searchable.
 * `querySort`, `limitValue` and `pageValue` do come from `buildBlogQuery` —
 * those are identical to the blog feed's.
 */
export const buildUserBlogsFilter = (search?: string): Prisma.BlogWhereInput =>
  search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

/**
 * The blog card shown in the dashboard's Likes and Bookmarks tabs.
 *
 * Shared by both endpoints because the two tabs render the same card — the
 * only difference between the queries is which join table they read. Nothing
 * from the `Like` / `Bookmark` row itself is selected: the card needs none of
 * it, and `slug` is what it navigates by.
 *
 * `satisfies`, not a type annotation: annotating collapses Prisma's literal
 * inference and the result shape stops being checked.
 */
export const likesAndBookmarksSelect = {
  id: true,
  title: true,
  slug: true,
  tags: true,
  coverImage: true,
  author: {
    select: {
      name: true,
      image: true,
    },
  },
} satisfies Prisma.BlogSelect;

/**
 * Which rows the Likes and Bookmarks tabs read.
 *
 * Scoped to the caller's own id — never a caller-supplied identifier — and to
 * blogs that are still published: one that has been unpublished since it was
 * liked or bookmarked would otherwise render a card linking to a dead page.
 *
 * `Like` and `Bookmark` both carry `@@unique([userId, blogId])`, whose backing
 * index leads with `userId`, so this needs no new index.
 *
 * The return type is deliberately structural rather than
 * `Prisma.LikeWhereInput`: the two models are unrelated types even though this
 * clause is valid for both.
 */
export const buildLikesAndBookmarksFilter = (userId: string) => ({
  userId,
  blog: { isPublished: true },
});

/**
 * Newest first, by when the caller liked or bookmarked the blog — not by when
 * the blog itself was written.
 *
 * The `id` tie-break keeps the order total. `createdAt` alone is not unique,
 * and two rows sharing a timestamp would otherwise sit in an arbitrary order
 * that can differ between the two pages that straddle them, so a row could be
 * skipped or repeated. History #2 records that bug on the admin comment feed.
 */
export const likesAndBookmarksOrder = [
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.LikeOrderByWithRelationInput[];

/**
 * Offset pagination for the Likes and Bookmarks tabs.
 *
 * `buildBlogQuery` is not reused: it also returns a `queryFilter` and a
 * `querySort` typed against `Blog`, and neither applies to a query over the
 * `Like` / `Bookmark` join rows. Only the two defaults are shared with it —
 * page 1, 10 per page — and they are kept identical on purpose.
 *
 * `limitValue` comes back alongside `take` because the caller needs it a
 * second time, to divide the total row count into pages.
 */
export const buildLikesAndBookmarksPage = (page?: number, limit?: number) => {
  const limitValue = limit ?? 10;
  const pageValue = page ?? 1;

  return {
    skip: (pageValue - 1) * limitValue,
    take: limitValue,
    limitValue,
  };
};
