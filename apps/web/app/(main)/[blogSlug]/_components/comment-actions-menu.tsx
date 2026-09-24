'use client';

import { useState } from 'react';
import { IoEllipsisHorizontalSharp } from 'react-icons/io5';
import { FaEdit } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteCommentDialog from './delete-comment-dialog';

type CommentActionsMenuProps = {
  slug: string;
  commentId: string;
  // Only the author can edit, so the card leaves this out for admins.
  onEdit?: () => void;
};

const CommentActionsMenu = ({
  slug,
  commentId,
  onEdit,
}: CommentActionsMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost-plain'
            size='icon'
            aria-label='Comment actions'
            className='text-muted-foreground'
          />
        }
      >
        <IoEllipsisHorizontalSharp className='size-5' />
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-40'>
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <FaEdit />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
          <FaTrash />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Outside the content, which unmounts on close and swallows keystrokes. */}
      <DeleteCommentDialog
        slug={slug}
        commentId={commentId}
        open={open}
        setOpen={setOpen}
      />
    </DropdownMenu>
  );
};

export default CommentActionsMenu;
