'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from 'lucide-react';
import type { GetAllBlogsResponse } from '@repo/types';
import { formatPublishedAt } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BlogActionsMenu from './blog-actions-menu';
import LikeButton from './like-button';
import BookmarkButton from './bookmark-button';

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
    shortDescription,
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

        <p className='line-clamp-2 text-muted-foreground'>{shortDescription}</p>

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

          <div className='relative z-10 ml-auto flex items-center'>
            <LikeButton
              slug={slug}
              likesCount={_count.likes}
              isLikedByLoggedInUser={isLikedByLoggedInUser}
              isOwnBlog={isOwnBlog}
            />
            <BookmarkButton
              slug={slug}
              isBookmarkedByLoggedInUser={isBookmarkedByLoggedInUser}
            />
          </div>
        </div>
      </div>

      {canReport && (
        <BlogActionsMenu
          slug={slug}
          className='absolute top-6 -right-1 z-10'
        />
      )}
    </article>
  );
};

export default BlogCard;
