'use client';

import { useEffect } from 'react';
import { useQueryStates } from 'nuqs';
import { cn } from '@/lib/utils';
import { userBlogsParsers } from '@/lib/search-params';
import { MIN_BLOG_SEARCH_LENGTH, useUserBlogs } from '@/hooks/blogs';
import RetryError from '@/components/shared/retry-error';
import SearchInput from '@/components/shared/search-input';
import BlogCard from '@/components/shared/blog-card';
import BlogPagination from '@/components/shared/pagination';
import BlogSortSelect from '@/components/home/blog-sort-select';
import BlogCardSkeleton from '@/components/home/blog-card-skeleton';

type UserBlogsListProps = {
  username: string;
  viewerId?: string;
  isAdmin: boolean;
  isOwnProfile: boolean;
};

// Client-only: the list is not meant for crawlers, so nothing is prefetched.
const UserBlogsList = ({
  username,
  viewerId,
  isAdmin,
  isOwnProfile,
}: UserBlogsListProps) => {
  const [{ search, sort, page }, setParams] = useQueryStates(userBlogsParsers);

  const { data, isPending, isError, isPlaceholderData, refetch } = useUserBlogs(
    { username, search, sort, page },
  );

  const isSearchTooShort =
    search.length > 0 && search.length < MIN_BLOG_SEARCH_LENGTH;
  const totalPages = data?.totalPages;

  // The owner deleting the only story on the last page leaves `page` past the end.
  useEffect(() => {
    if (totalPages && page > totalPages) setParams({ page: totalPages });
  }, [page, totalPages, setParams]);

  // The ellipsis only shows when the name was actually cut.
  const shortName =
    username.length > 10 ? `${username.slice(0, 10)}…` : username;

  return (
    <section className='flex flex-col' aria-labelledby='stories-heading'>
      <h2
        id='stories-heading'
        className='pt-8 pb-3 text-2xl font-bold tracking-tight'
      >
        View {isOwnProfile ? 'your stories' : `${shortName}'s stories`}
      </h2>

      <div className='flex items-center justify-between gap-4 py-4'>
        <SearchInput
          defaultValue={search}
          onSearch={(next) => setParams({ search: next, page: 1 })}
          placeholder={`Search ${username}...`}
          className='h-9 max-w-xs'
        />
        <BlogSortSelect
          sort={sort}
          onSortChange={(next) => setParams({ sort: next, page: 1 })}
        />
      </div>

      {isSearchTooShort && (
        <p className='pb-2 text-xs text-muted-foreground'>
          Type at least {MIN_BLOG_SEARCH_LENGTH} characters to search.
        </p>
      )}

      {isPending ? (
        !isSearchTooShort && <BlogCardSkeleton count={3} />
      ) : isError ? (
        <RetryError
          message='Something went wrong loading these stories.'
          onRetry={() => refetch()}
        />
      ) : data.blogs.length === 0 ? (
        <p className='py-16 text-center text-muted-foreground'>
          {search && !isSearchTooShort
            ? `No stories match "${search}".`
            : isOwnProfile
              ? "You haven't published any stories yet."
              : `${username} hasn't published any stories yet.`}
        </p>
      ) : (
        <>
          <div
            className={cn(
              'divide-y transition-opacity',
              isPlaceholderData && !isSearchTooShort && 'opacity-60',
            )}
          >
            {data.blogs.map((blog, index) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                viewerId={viewerId}
                isAdmin={isAdmin}
                priority={index === 0}
              />
            ))}
          </div>

          <BlogPagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={(next) => setParams({ page: next })}
            className='justify-end py-8'
          />
        </>
      )}
    </section>
  );
};

export default UserBlogsList;
