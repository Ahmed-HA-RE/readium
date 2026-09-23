import type { Comment } from '@repo/types';
import { formatPublishedAt } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type CommentCardProps = {
  comment: Comment;
  isOwnComment: boolean;
};

const CommentCard = ({ comment, isOwnComment }: CommentCardProps) => {
  const { author, content, createdAt } = comment;

  return (
    <article className='flex gap-3 py-6'>
      <Avatar>
        <AvatarImage src={author.image ?? DEFAULT_AVATAR} alt={author.name} />
        <AvatarFallback>{author.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex flex-col'>
          <span className='truncate text-sm font-medium'>
            {isOwnComment ? 'Me' : author.name}
          </span>
          <time
            dateTime={new Date(createdAt).toISOString()}
            className='text-xs text-muted-foreground'
          >
            {formatPublishedAt(createdAt)}
          </time>
        </div>

        <p className='text-sm break-words whitespace-pre-line'>{content}</p>
      </div>
    </article>
  );
};

export default CommentCard;
