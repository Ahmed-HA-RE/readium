import { Prisma } from '../../generated/prisma/client';
import { BlogSortOptions } from '../dto/blog-query-dto';

export const buildBlogQuery = (
  search?: string,
  sort?: BlogSortOptions,
  page?: number,
  limit?: number,
) => {
  const limitValue = limit ? limit : 10;
  const pageValue = page ? page : 1;

  // If search query is provided, filter blogs by title or content or author's name
  const queryFilter: Prisma.BlogWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  // Neither `createdAt` nor the like count is unique, and rows that compare
  // equal on every key have no defined order — so the feed reshuffles once a
  // like changes the count. `id` last makes each ordering total.
  const querySort: Prisma.BlogOrderByWithRelationInput[] =
    sort === BlogSortOptions.OLDEST
      ? [{ createdAt: 'asc' }, { id: 'asc' }]
      : sort === BlogSortOptions.MOST_LIKED
        ? [{ likes: { _count: 'desc' } }, { id: 'desc' }]
        : [{ createdAt: 'desc' }, { id: 'desc' }];
  return { queryFilter, querySort, limitValue, pageValue };
};
