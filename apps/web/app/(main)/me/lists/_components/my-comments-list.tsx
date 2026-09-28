'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMyComments } from '@/hooks/comments';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import RetryError from '@/components/shared/retry-error';
import MyCommentCard from './my-comment-card';
import MyCommentCardSkeleton from './my-comment-card-skeleton';

type MyCommentsListProps = {
  viewerName: string;
};

const MyCommentsList = ({ viewerName }: MyCommentsListProps) => {
  const {
    data,
    isPending,
    isError,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useMyComments();

  // Starts the next page a little before the sentinel scrolls into view.
  const { ref, inView } = useInView({ rootMargin: '200px' });

  // Re-runs when a page finishes, so a sentinel still on screen keeps loading.
  // `isError` stops a failing page being re-requested in a loop.
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  if (isPending) return <MyCommentCardSkeleton />;

  // A failed later page keeps the rows already loaded, handled below.
  if (isError && !isFetchNextPageError) {
    return (
      <RetryError
        message='Something went wrong loading your comments.'
        onRetry={() => refetch()}
      />
    );
  }

  const comments = data.pages.flatMap((page) => page.data);

  if (comments.length === 0) {
    return (
      <p className='py-16 text-center text-muted-foreground'>
        You haven&apos;t responded to any stories yet.
      </p>
    );
  }

  return (
    <>
      <div className='divide-y'>
        {comments.map((comment) => (
          <MyCommentCard
            key={comment.id}
            comment={comment}
            viewerName={viewerName}
          />
        ))}
      </div>

      {isFetchNextPageError ? (
        <div className='flex flex-col items-center gap-3 py-6'>
          <p className='text-sm text-muted-foreground'>
            Could not load more comments.
          </p>
          <Button variant='outline' onClick={() => fetchNextPage()}>
            Try again
          </Button>
        </div>
      ) : (
        hasNextPage && (
          <div ref={ref} className='flex justify-center py-6'>
            {isFetchingNextPage && <Spinner />}
          </div>
        )
      )}
    </>
  );
};

export default MyCommentsList;
