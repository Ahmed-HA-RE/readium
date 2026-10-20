import Link from 'next/link';
import Image from 'next/image';
import type { Blog, BlogAuthor } from '@repo/types';
import { formatPublishedAt } from '@/lib/utils';
import { getBlogPath, getProfilePath } from '@/lib/routes';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BlogActionsMenu from './blog-actions-menu';

const coverImageStyles = { width: '100%', height: 'auto' };

type DashboardBlogCardProps = {
  // `_count` is absent on the likes and bookmarks lists.
  blog: Pick<
    Blog,
    'title' | 'slug' | 'shortDescription' | 'tags' | 'coverImage' | 'createdAt'
  > &
    Partial<Pick<Blog, '_count'>>;
  author: Pick<BlogAuthor, 'name' | 'image'>;
  isOwnBlog: boolean;
  priority?: boolean;
};

const DashboardBlogCard = ({
  blog,
  author,
  isOwnBlog,
  priority = false,
}: DashboardBlogCardProps) => {
  const {
    title,
    slug,
    shortDescription,
    tags,
    coverImage,
    createdAt,
    _count: counts,
  } = blog;
  const href = getBlogPath(author.name, slug);
  const profileHref = getProfilePath(author.name);

  return (
    <article className='group relative flex gap-8 py-8 max-sm:flex-col'>
      {coverImage && (
        <Link
          href={href}
          className='block h-41 w-49 shrink-0 overflow-hidden rounded-lg max-sm:order-last max-sm:w-full'
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
            style={coverImageStyles}
          />
        </Link>
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
          href={href}
          className='text-xl font-medium after:absolute after:inset-0'
        >
          {title}
        </Link>

        <p className='line-clamp-2 text-muted-foreground'>{shortDescription}</p>

        <div className='flex min-w-0 items-center gap-3'>
          <Link
            href={profileHref}
            className='relative z-10 shrink-0'
            tabIndex={-1}
            aria-hidden
          >
            <Avatar size='lg'>
              <Image
                src={author.image ?? DEFAULT_AVATAR}
                alt={author.name}
                width={40}
                height={40}
                className='aspect-square size-full rounded-full object-cover'
              />
            </Avatar>
          </Link>
          <div className='flex min-w-0 flex-col'>
            <Link
              href={profileHref}
              className='relative z-10 truncate font-medium hover:underline'
            >
              {author.name}
            </Link>
            <span className='text-sm text-muted-foreground'>
              {formatPublishedAt(createdAt)}
            </span>
          </div>
        </div>
      </div>

      <BlogActionsMenu
        slug={slug}
        title={title}
        counts={counts}
        isOwnBlog={isOwnBlog}
        className='absolute top-6 -right-1 z-10'
      />
    </article>
  );
};

export default DashboardBlogCard;
