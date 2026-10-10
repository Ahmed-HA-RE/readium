'use client';

import { useState } from 'react';
import type { Comment } from '@repo/types';
import { formatPublishedAt } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProBadge from '@/components/shared/pro-badge';
import CommentActionsMenu from './comment-actions-menu';
import EditCommentForm from './edit-comment-form';

type CommentCardProps = {
  slug: string;
  comment: Comment;
  isOwnComment: boolean;
  canDelete: boolean;
};

const CommentCard = ({
  slug,
  comment,
  isOwnComment,
  canDelete,
}: CommentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { id, author, content, createdAt, updatedAt } = comment;

  const isEdited =
    new Date(updatedAt).getTime() !== new Date(createdAt).getTime();
  const shownAt = isEdited ? updatedAt : createdAt;

  return (
    <article className='flex gap-3 py-6'>
      <Avatar>
        <AvatarImage src={author.image ?? DEFAULT_AVATAR} alt={author.name} />
        <AvatarFallback>{author.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 flex-col'>
            <span className='flex min-w-0 items-center gap-1'>
              <span className='truncate text-sm font-medium'>
                {isOwnComment ? 'Me' : author.name}
              </span>
              {author.isPro && <ProBadge className='size-3.5' />}
            </span>
            <span className='text-xs text-muted-foreground'>
              <time dateTime={new Date(shownAt).toISOString()}>
                {formatPublishedAt(shownAt)}
              </time>
              {isEdited && ' (edited)'}
            </span>
          </div>

          {canDelete && !isEditing && (
            <CommentActionsMenu
              slug={slug}
              commentId={id}
              onEdit={isOwnComment ? () => setIsEditing(true) : undefined}
            />
          )}
        </div>

        {isEditing ? (
          <EditCommentForm
            slug={slug}
            commentId={id}
            initialContent={content}
            onClose={() => setIsEditing(false)}
          />
        ) : (
          <p className='text-sm break-words whitespace-pre-line'>{content}</p>
        )}
      </div>
    </article>
  );
};

export default CommentCard;
