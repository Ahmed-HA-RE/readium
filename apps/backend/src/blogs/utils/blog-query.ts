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

  // If sort query is provided, sort blogs by the specified option
  const querySort: Prisma.BlogOrderByWithRelationInput = sort
    ? sort === BlogSortOptions.NEWEST
      ? {
          createdAt: 'desc',
        }
      : sort === BlogSortOptions.OLDEST
        ? {
            createdAt: 'asc',
          }
        : {
            likes: {
              _count: 'desc',
            },
          }
    : {
        createdAt: 'desc',
      };
  return { queryFilter, querySort, limitValue, pageValue };
};
