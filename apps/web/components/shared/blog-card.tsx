'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from 'lucide-react';
import { FaBookmark, FaHeart, FaRegHeart } from 'react-icons/fa';
import { LuBookmarkPlus } from 'react-icons/lu';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { GetAllBlogsResponse } from '@repo/types';
import { cn, formatPublishedAt, getErrorMessage } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { likeBlog } from '@/lib/actions/blogs/likeBlog';
import { unlikeBlog } from '@/lib/actions/blogs/unlikeBlog';
import { bookmarkBlog } from '@/lib/actions/blogs/bookmarkBlog';
import { unbookmarkBlog } from '@/lib/actions/blogs/unbookmarkBlog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ReportBlog from './report-blog';

type BlogCardProps = {
  blog: GetAllBlogsResponse['blogs'][number];
  viewerId?: string;
  isAdmin: boolean;
  // True for the one card whose cover is the feed's largest paint.
  priority: boolean;
};

const BlogCard = ({ blog, viewerId, isAdmin, priority }: BlogCardProps) => {
  const {
    title,
    slug,
    content,
    tags,
    coverImage,
    author,
    authorId,
    createdAt,
    _count,
    isLikedByLoggedInUser,
    isBookmarkedByLoggedInUser,
  } = blog;

  const isOwnBlog = authorId === viewerId;

  // Reporting is `@Roles(['user'])` and the service rejects your own blog, so
  // for these two the menu could only ever produce an error toast.
  const canReport = !isAdmin && !isOwnBlog;

  const queryClient = useQueryClient();

  // Separate transitions, so a bookmark in flight never blocks a like.
  const [isLiking, startLiking] = useTransition();
  const [isBookmarking, startBookmarking] = useTransition();

  const [isLikedOptimistic, setIsLikedOptimistic] = useOptimistic(
    isLikedByLoggedInUser,
  );
  const [isBookmarkedOptimistic, setIsBookmarkedOptimistic] = useOptimistic(
    isBookmarkedByLoggedInUser,
  );

  // Zero unless the UI is a click ahead of the server, which is the only case
  // where `_count.likes` does not already account for the reader's own like.
  const pendingLikeDelta =
    isLikedOptimistic === isLikedByLoggedInUser
      ? 0
      : isLikedOptimistic
        ? 1
        : -1;
  const likesCount = _count.likes + pendingLikeDelta;

  const toggleLike = () => {
    const nextIsLiked = !isLikedOptimistic;

    startLiking(async () => {
      setIsLikedOptimistic(nextIsLiked);

      // The optimistic flip above still lands; only the request is skipped,
      // because the endpoint 400s on a state it is already in.
      if (isLiking) return;

      try {
        await (nextIsLiked ? likeBlog(slug) : unlikeBlog(slug));
        await queryClient.invalidateQueries({ queryKey: ['blogs'] });
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not update your like'));
      }
    });
  };

  const toggleBookmark = () => {
    const nextIsBookmarked = !isBookmarkedOptimistic;

    startBookmarking(async () => {
      setIsBookmarkedOptimistic(nextIsBookmarked);

      if (isBookmarking) return;

      try {
        await (nextIsBookmarked ? bookmarkBlog(slug) : unbookmarkBlog(slug));
        await queryClient.invalidateQueries({ queryKey: ['blogs'] });
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not update your bookmark'));
      }
    });
  };

  // Sits under the cover image when there is one, otherwise at the bottom of
  // the text column.
  const readMoreButton = (
    <Button
      className='group w-fit bg-primary/10 hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'
      size='lg'
      nativeButton={false}
      render={<Link href={`/${slug}`} />}
    >
      Read More
      <ArrowRightIcon className='transition-transform duration-200 group-hover:translate-x-0.5' />
    </Button>
  );

  return (
    <article className='group relative flex gap-8 py-8 max-sm:flex-col'>
      {coverImage && (
        <div className='flex shrink-0 flex-col gap-4 max-sm:order-last'>
          <Link
            href={`/${slug}`}
            className='block h-41 w-49 overflow-hidden rounded-lg max-sm:w-full'
            tabIndex={-1}
            aria-hidden
          >
            <Image
              src={coverImage}
              alt={title}
              width={196}
              height={164}
              priority={priority}
              className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
            />
          </Link>

          {readMoreButton}
        </div>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-3'>
        {tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {tags.map((tag) => (
              <Badge key={tag} variant='secondary' className='font-normal'>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={`/${slug}`}
          className='text-xl font-medium after:absolute after:inset-0'
        >
          {title}
        </Link>

        <p className='line-clamp-2 text-muted-foreground'>{content}</p>

        <div className='flex items-center gap-3'>
          <Avatar size='lg'>
            <Image
              src={author.image ?? DEFAULT_AVATAR}
              alt={author.name}
              width={40}
              height={40}
              className='aspect-square size-full rounded-full object-cover'
            />
          </Avatar>
          <div className='flex min-w-0 flex-col'>
            <span className='truncate font-medium'>{author.name}</span>
            <span className='text-sm text-muted-foreground'>
              {formatPublishedAt(createdAt)}
            </span>
          </div>
        </div>

        <div className='mt-2 flex items-center gap-4'>
          {!coverImage && readMoreButton}

          <div
            className={cn(
              'relative z-10 ml-auto flex items-center text-sm',
              likesCount > 0 ? 'gap-2' : 'gap-0',
            )}
          >
            <span className='flex items-center'>
              {/* The author still sees the tally, just not a control the
                  endpoint would reject. */}
              {isOwnBlog ? (
                <span className='flex size-8 items-center justify-center text-muted-foreground'>
                  <FaRegHeart />
                </span>
              ) : (
                <Button
                  variant='ghost-plain'
                  size='icon'
                  onClick={toggleLike}
                  aria-pressed={isLikedOptimistic}
                  aria-label={isLikedOptimistic ? 'Unlike' : 'Like'}
                  className={cn(
                    !isLikedOptimistic &&
                      'text-muted-foreground hover:text-red-600',
                  )}
                >
                  {isLikedOptimistic ? (
                    <FaHeart className='size-4 text-red-600' />
                  ) : (
                    <FaRegHeart />
                  )}
                </Button>
              )}
              {likesCount > 0 && (
                <span className='text-muted-foreground'>{likesCount}</span>
              )}
            </span>

            <Button
              variant='ghost-plain'
              size='icon'
              onClick={toggleBookmark}
              aria-pressed={isBookmarkedOptimistic}
              aria-label={
                isBookmarkedOptimistic ? 'Remove bookmark' : 'Bookmark'
              }
              className={cn(
                isBookmarkedOptimistic
                  ? 'text-blue-600 hover:text-blue-600'
                  : 'text-muted-foreground hover:text-blue-600',
              )}
            >
              {isBookmarkedOptimistic ? <FaBookmark /> : <LuBookmarkPlus />}
            </Button>
          </div>
        </div>
      </div>

      {canReport && <ReportBlog slug={slug} />}
    </article>
  );
};

export default BlogCard;
