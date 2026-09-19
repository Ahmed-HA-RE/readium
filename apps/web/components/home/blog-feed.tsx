'use client';

import { useQueryStates } from 'nuqs';
import { blogFeedParsers } from '@/lib/search-params';
import { useAllBlogs } from '@/hooks/blogs';
import { Button } from '@/components/ui/button';
import BlogCard from '@/components/shared/blog-card';
import BlogPagination from '@/components/shared/pagination';
import BlogSortSelect from './blog-sort-select';
import BlogCardSkeleton from './blog-card-skeleton';

// Read from the URL rather than from props so the select and pagination
// repaint immediately, instead of waiting on the `shallow: false` round-trip.
// Both sides parse the same URL with the same parsers, so the query key still
// matches what the server prefetched.
const BlogFeed = () => {
  const [{ sort, page }, setFeedParams] = useQueryStates(blogFeedParsers, {
    shallow: false,
  });

  const { data, isPending, isError } = useAllBlogs({ sort, page });

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between gap-4 border-b pb-4'>
        <h1 className='text-lg font-medium'>For you</h1>
        <BlogSortSelect
          sort={sort}
          // Sorting invalidates the current offset, so it resets to page 1.
          onSortChange={(next) => setFeedParams({ sort: next, page: 1 })}
        />
      </div>

      {isPending ? (
        <BlogCardSkeleton />
      ) : isError ? (
        <div className='flex flex-col items-center gap-3 py-16'>
          <p className='text-muted-foreground'>
            Something went wrong loading the feed.
          </p>

          <Button
            variant='outline'
            size='lg'
            onClick={() => setFeedParams(null)}
          >
            Try again
          </Button>
        </div>
      ) : !data || data.blogs.length === 0 ? (
        <p className='py-16 text-center text-muted-foreground'>
          No blogs to show yet.
        </p>
      ) : (
        <>
          <div className='divide-y'>
            {data.blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          <BlogPagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={(next) => setFeedParams({ page: next })}
            className='justify-end py-8'
          />
        </>
      )}
    </div>
  );
};

export default BlogFeed;
