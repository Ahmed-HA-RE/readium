'use client';

import { useQueryStates } from 'nuqs';
import { MyBlogsStatus, type BlogAuthor } from '@repo/types';
import { cn } from '@/lib/utils';
import { myStoriesParsers } from '@/lib/search-params';
import { useMyBlogs } from '@/hooks/blogs';
import { Button } from '@/components/ui/button';
import SearchInput from '@/components/shared/search-input';
import DashboardBlogCard from '@/components/shared/dashboard-blog-card';
import BlogPagination from '@/components/shared/pagination';
import BlogSortSelect from '@/components/home/blog-sort-select';
import BlogCardSkeleton from '@/components/home/blog-card-skeleton';

type MyStoriesListProps = {
  author: Pick<BlogAuthor, 'name' | 'image'>;
};

const MyStoriesList = ({ author }: MyStoriesListProps) => {
  const [params, setParams] = useQueryStates(myStoriesParsers);
  const { status, search, sort, page } = params;

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useMyBlogs(params);

  const emptyMessage = search
    ? `No stories match "${search}".`
    : status === MyBlogsStatus.DRAFT
      ? 'You have no drafts.'
      : "You haven't published any stories yet.";

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between gap-4 py-4'>
        <SearchInput
          defaultValue={search}
          onSearch={(next) => setParams({ search: next, page: 1 })}
          placeholder='Search your stories'
          className='h-9 max-w-xs'
        />
        <BlogSortSelect
          sort={sort}
          onSortChange={(next) => setParams({ sort: next, page: 1 })}
        />
      </div>

      {isPending ? (
        <BlogCardSkeleton />
      ) : isError ? (
        <div className='flex flex-col items-center gap-3 py-16'>
          <p className='text-muted-foreground'>
            Something went wrong loading your stories.
          </p>
          <Button variant='outline' size='lg' onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.blogs.length === 0 ? (
        <p className='py-16 text-center text-muted-foreground'>
          {emptyMessage}
        </p>
      ) : (
        <>
          <div
            className={cn(
              'divide-y transition-opacity',
              isPlaceholderData && 'opacity-60',
            )}
          >
            {data.blogs.map((blog, index) => (
              <DashboardBlogCard
                key={blog.id}
                blog={blog}
                author={author}
                isOwnBlog
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
    </div>
  );
};

export default MyStoriesList;
