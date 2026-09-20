import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from 'lucide-react';
import { FaBookmark, FaHeart, FaRegHeart } from 'react-icons/fa';
import { LuBookmarkPlus } from 'react-icons/lu';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import type { GetAllBlogsResponse } from '@repo/types';
import { cn, formatPublishedAt } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type BlogCardProps = {
  blog: GetAllBlogsResponse['blogs'][number];
};

const BlogCard = ({ blog }: BlogCardProps) => {
  const {
    title,
    slug,
    content,
    tags,
    coverImage,
    author,
    createdAt,
    _count,
    isLikedByLoggedInUser,
    isBookmarkedByLoggedInUser,
  } = blog;

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
            <AvatarImage
              src={author.image ?? DEFAULT_AVATAR}
              alt={author.name}
            />
            <AvatarFallback>
              {author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
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

          {/* Display only this phase — the mutations land with the like and
              bookmark features. */}
          <div
            className={cn(
              'relative z-10 ml-auto flex items-center text-sm',
              _count.likes > 0 ? 'gap-2' : 'gap-0',
            )}
          >
            <span className='flex items-center'>
              {isLikedByLoggedInUser ? (
                <Button variant='ghost-plain' size={'icon'}>
                  <FaHeart className='size-4 text-red-600' />
                </Button>
              ) : (
                <Button
                  variant='ghost-plain'
                  size={'icon'}
                  className='text-muted-foreground hover:text-red-600'
                >
                  <FaRegHeart />
                </Button>
              )}
              {_count.likes > 0 && (
                <span className='text-muted-foreground'>{_count.likes}</span>
              )}
            </span>

            {isBookmarkedByLoggedInUser ? (
              <Button
                variant='ghost-plain'
                size={'icon'}
                className='text-blue-600'
              >
                <FaBookmark />
              </Button>
            ) : (
              <Button
                variant='ghost-plain'
                size={'icon'}
                className='text-muted-foreground hover:text-blue-600'
              >
                <LuBookmarkPlus />
              </Button>
            )}
          </div>
        </div>
      </div>

      <IoEllipsisHorizontal className='absolute top-8 right-0 z-10 size-5 text-muted-foreground' />
    </article>
  );
};

export default BlogCard;
