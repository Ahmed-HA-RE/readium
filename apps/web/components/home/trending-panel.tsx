import Link from 'next/link';
import { formatPublishedAt, getBlogPath } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { getTrendingBlogs } from '@/lib/actions/blogs/getTrendingBlogs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TrendingPanel = async () => {
  const blogs = await getTrendingBlogs();

  return blogs.map(({ title, slug, shortDescription, createdAt, author }) => (
    <article key={slug} className='group relative flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <Avatar size='sm'>
          <AvatarImage src={author.image ?? DEFAULT_AVATAR} alt={author.name} />
          <AvatarFallback>{author.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className='truncate text-sm'>{author.name}</span>
      </div>

      <div className='space-y-2'>
        <Link
          href={getBlogPath(author.name, slug)}
          className='line-clamp-2 leading-snug font-bold after:absolute after:inset-0'
        >
          {title}
        </Link>

        <p className='line-clamp-2 text-sm text-muted-foreground'>
          {shortDescription}
        </p>

        <span className='text-xs text-muted-foreground'>
          {formatPublishedAt(createdAt)}
        </span>
      </div>
    </article>
  ));
};

export default TrendingPanel;
