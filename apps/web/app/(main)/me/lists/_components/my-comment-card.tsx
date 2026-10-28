'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa6';
import type { GetMyComments } from '@repo/types';
import { formatPublishedAt } from '@/lib/utils';
import { getBlogPath } from '@/lib/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DeleteCommentDialog from '@/components/shared/delete-comment-dialog';

type MyCommentCardProps = {
  comment: GetMyComments['data'][number];
  viewerName: string;
};

// Memoised so appending a cursor page re-renders only the new cards; the
// query cache keeps earlier rows referentially stable.
const MyCommentCard = memo(function MyCommentCard({
  comment,
  viewerName,
}: MyCommentCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { id, content, createdAt, blog } = comment;
  const isOwnBlog = blog.author.name === viewerName;
  // Someone else's draft 404s for this viewer, so it gets no link.
  const isReachable = blog.isPublished || isOwnBlog;

  return (
    <article className='relative flex flex-col gap-4 py-6 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          {blog.coverImage && (
            <Image
              src={blog.coverImage}
              alt=''
              width={256}
              height={256}
              className='size-16 shrink-0 rounded-md object-cover'
            />
          )}

          <div className='flex min-w-0 flex-col'>
            <p className='line-clamp-1 text-sm text-muted-foreground'>
              Responded to{' '}
              {isReachable ? (
                <Link
                  href={`${getBlogPath(blog.author.name, blog.slug)}#comments`}
                  className='font-medium text-foreground after:absolute after:inset-0 hover:underline'
                >
                  {blog.title}
                </Link>
              ) : (
                <span className='font-medium text-foreground'>
                  {blog.title}
                </span>
              )}
            </p>

            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <span className='truncate'>
                {isOwnBlog ? 'Your story' : `by ${blog.author.name}`}
              </span>
              <span aria-hidden>·</span>
              <time
                dateTime={new Date(createdAt).toISOString()}
                className='shrink-0'
              >
                {formatPublishedAt(createdAt)}
              </time>
            </div>
          </div>
        </div>

        {/* The backend's delete 404s on a draft's comments, so a draft gets the badge instead. */}
        {blog.isPublished ? (
          <>
            <Button
              variant='ghost-plain'
              size='icon'
              aria-label='Delete comment'
              onClick={() => setIsDeleteOpen(true)}
              className='relative z-10 shrink-0 text-muted-foreground hover:text-destructive'
            >
              <FaTrash />
            </Button>

            <DeleteCommentDialog
              slug={blog.slug}
              commentId={id}
              open={isDeleteOpen}
              setOpen={setIsDeleteOpen}
            />
          </>
        ) : (
          <Badge variant='warning' className='shrink-0 font-normal'>
            Unpublished
          </Badge>
        )}
      </div>

      <blockquote className='line-clamp-4 border-l-2 pl-4 break-words whitespace-pre-line'>
        {content}
      </blockquote>
    </article>
  );
});

export default MyCommentCard;
