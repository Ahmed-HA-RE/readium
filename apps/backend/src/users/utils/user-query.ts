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
