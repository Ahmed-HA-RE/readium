import Link from 'next/link';
import Image from 'next/image';
import { Source_Serif_4 } from 'next/font/google';
import type { Blog, BlogAuthor } from '@repo/types';
import { cn, formatPublishedAt, getReadingTime } from '@/lib/utils';
import { highlightCodeBlocks } from '@/lib/highlight-code-blocks';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const serif = Source_Serif_4({ subsets: ['latin'] });

type BlogArticleProps = {
  blog: Pick<Blog, 'title' | 'tags' | 'coverImage' | 'createdAt'> & {
    author: Pick<BlogAuthor, 'name' | 'image'>;
  };
  // Must already be sanitized with `sanitizeBlogHtml`.
  html: string;
  // The bar under the author row: reader actions publicly, moderation for admins.
  actions?: React.ReactNode;
  // Left out on the admin dashboard, which does not show comments.
  comments?: React.ReactNode;
};

// Presentation only, so the public page and the admin dashboard render a blog
// identically while fetching it their own way.
const BlogArticle = ({ blog, html, actions, comments }: BlogArticleProps) => {
  const { title, tags, coverImage, createdAt, author } = blog;

  return (
    <article className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8'>
      {coverImage && (
        <Image
          src={coverImage}
          alt={title}
          width={1200}
          height={630}
          priority
          sizes='(min-width: 1024px) 1024px, 100vw'
          className='h-auto max-h-120 w-full rounded-lg object-cover'
        />
      )}

      <div className='mx-auto flex w-full max-w-170 flex-col gap-8'>
        <header className='flex flex-col gap-6'>
          {tags.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='font-normal'>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className='text-3xl leading-tight font-bold tracking-tight sm:text-[42px]'>
            {title}
          </h1>

          <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
            <Link
              href={`/users/${author.name}`}
              className='flex items-center gap-3 font-medium text-foreground hover:underline'
            >
              <Avatar size='lg'>
                <AvatarImage
                  src={author.image ?? DEFAULT_AVATAR}
                  alt={author.name}
                />
                <AvatarFallback>
                  {author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {author.name}
            </Link>
            <span aria-hidden>·</span>
            <span>{getReadingTime(html)} min read</span>
            <span aria-hidden>·</span>
            <time dateTime={new Date(createdAt).toISOString()}>
              {formatPublishedAt(createdAt)}
            </time>
          </div>

          {actions}
        </header>

        <div
          className={cn(
            serif.className,
            'prose prose-lg max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:underline-offset-4 prose-pre:rounded-lg prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-foreground prose-blockquote:text-foreground marker:text-foreground',
          )}
          dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(html) }}
        />

        {comments}
      </div>
    </article>
  );
};

export default BlogArticle;
