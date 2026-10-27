'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { TriangleAlertIcon } from 'lucide-react';
import { TbPinnedFilled } from 'react-icons/tb';
import type { Comment } from '@repo/types';
import { getErrorMessage } from '@/lib/utils';
import { getLoginPath } from '@/lib/routes';
import { useBlogComments } from '@/hooks/comments';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AddCommentForm from './add-comment-form';
import CommentCard from './comment-card';

type CommentsSectionProps = {
  slug: string;
  commentsCount: number;
  viewer: {
    id: string;
    name: string;
    image: string | null;
    role: string | string[] | undefined;
    isPro: boolean;
  } | null;
  // The comment a notification linked to, fetched by the page from `?commentId=`.
  pinnedComment: Comment | null;
};

const CommentsSection = ({
  slug,
  commentsCount,
  viewer,
  pinnedComment,
}: CommentsSectionProps) => {
  const pathname = usePathname();
  const {
    data,
    error,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useBlogComments(slug);

  const { ref, inView } = useInView();

  // Also re-runs when a page finishes, so a sentinel still on screen keeps
  // loading. `isError` stops a failing page being re-requested in a loop.
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const comments = data?.pages.flatMap((page) => page.data) ?? [];
  // The pinned comment already shows above the thread, so the feed skips it when its page arrives.
  const listedComments = pinnedComment
    ? comments.filter(({ id }) => id !== pinnedComment.id)
    : comments;

  // A failed first page also leaves `comments` empty, which is not "no comments".
  const isEmpty = comments.length === 0 && !isError;

  return (
    <section
      id='comments'
      aria-labelledby='comments-heading'
      className='flex scroll-mt-20 flex-col gap-6'
    >
      <h2 id='comments-heading' className='text-xl font-bold'>
        Responses ({commentsCount})
      </h2>

      {/* Admins moderate the thread (delete stays on each card) but don't post in it. */}
      {viewer?.role === 'admin' ? null : viewer ? (
        <AddCommentForm slug={slug} viewer={viewer} />
      ) : (
        <div className='flex flex-col items-start gap-3 rounded-lg bg-muted/50 p-4'>
          <p className='text-sm text-muted-foreground'>
            Sign in to share your thoughts on this story.
          </p>
          <Link
            href={getLoginPath(pathname)}
            className={buttonVariants({
              size: 'sm',
              className: 'rounded-full',
            })}
          >
            Sign in to respond
          </Link>
        </div>
      )}

      {/* Outside the pending branch, so it is in the first HTML and the link's `#comment-<id>` scrolls to it. */}
      {pinnedComment && (
        <div
          id={`comment-${pinnedComment.id}`}
          className='scroll-mt-20 rounded-lg border-l-2 border-primary bg-primary/5 px-4'
        >
          <p className='flex items-center gap-1.5 pt-4 text-xs font-medium text-primary'>
            <TbPinnedFilled className='size-3.5' />
            Linked response
          </p>
          <CommentCard
            slug={slug}
            comment={pinnedComment}
            isOwnComment={pinnedComment.author.id === viewer?.id}
            canDelete={
              pinnedComment.author.id === viewer?.id || viewer?.role === 'admin'
            }
          />
        </div>
      )}

      {isPending ? (
        <div className='flex justify-center py-8'>
          <Spinner />
        </div>
      ) : (
        <>
          {isEmpty && (
            <p className='py-8 text-center text-muted-foreground'>
              There are no comments for this blog yet. Be the first to share
              your opinion.
            </p>
          )}

          {listedComments.length > 0 && (
            <div className='divide-y'>
              {listedComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  slug={slug}
                  comment={comment}
                  isOwnComment={comment.author.id === viewer?.id}
                  canDelete={
                    comment.author.id === viewer?.id || viewer?.role === 'admin'
                  }
                />
              ))}
            </div>
          )}

          {isError && (
            <Alert className='border-none bg-destructive text-white dark:bg-destructive/60'>
              <TriangleAlertIcon />
              <AlertTitle>
                {getErrorMessage(error, 'Could not load the responses')}
              </AlertTitle>
            </Alert>
          )}

          {hasNextPage && (
            <div ref={ref} className='flex justify-center py-4'>
              {isFetchingNextPage && <Spinner />}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CommentsSection;
