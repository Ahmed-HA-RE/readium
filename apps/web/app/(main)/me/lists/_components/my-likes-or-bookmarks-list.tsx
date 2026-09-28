'use client';

import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { listsParsers } from '@/lib/search-params';
import type { LikesOrBookmarks } from '@/lib/actions/user/getMyLikesOrBookmarks';
import { useMyLikesOrBookmarks } from '@/hooks/blogs';
import DashboardBlogCard from '@/components/shared/dashboard-blog-card';
import BlogPagination from '@/components/shared/pagination';
import RetryError from '@/components/shared/retry-error';
import BlogCardSkeleton from '@/components/home/blog-card-skeleton';

const EMPTY_MESSAGES: Record<LikesOrBookmarks, string> = {
  bookmarks: "You haven't bookmarked any stories yet.",
  likes: "You haven't liked any stories yet.",
};

type MyLikesOrBookmarksListProps = {
  list: LikesOrBookmarks;
  viewerId: string;
};

const MyLikesOrBookmarksList = ({
  list,
  viewerId,
}: MyLikesOrBookmarksListProps) => {
  const [page, setPage] = useQueryState('page', listsParsers.page);

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useMyLikesOrBookmarks(list, page);

  if (isPending) return <BlogCardSkeleton />;

  if (isError) {
    return (
      <RetryError
        message={`Something went wrong loading your ${list}.`}
        onRetry={() => refetch()}
      />
    );
  }

  if (data.blogs.length === 0) {
    return (
      <p className='py-16 text-center text-muted-foreground'>
        {EMPTY_MESSAGES[list]}
      </p>
    );
  }

  return (
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
            author={blog.author}
            isOwnBlog={blog.authorId === viewerId}
            priority={index === 0}
          />
        ))}
      </div>

      <BlogPagination
        page={page}
        totalPages={data.totalPages}
        onPageChange={(next) => setPage(next)}
        className='justify-end py-8'
      />
    </>
  );
};

export default MyLikesOrBookmarksList;
