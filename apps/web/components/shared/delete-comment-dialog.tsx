'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { deleteComment } from '@/lib/actions/comments/deleteComment';
import ConfirmDeleteDialog from '@/components/shared/confirm-delete-dialog';

type DeleteCommentDialogProps = {
  slug: string;
  commentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DeleteCommentDialog = ({
  slug,
  commentId,
  open,
  setOpen,
}: DeleteCommentDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const onDeleteComment = async () => {
    try {
      await deleteComment({ slug, commentId });

      // Refreshes the blog page's server-rendered response count.
      router.refresh();
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment deleted successfully');
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the comment'));
    }
  };

  return (
    <ConfirmDeleteDialog
      title='Delete comment'
      description="Are you sure you want to delete this comment? This action can't be undone."
      open={open}
      setOpen={setOpen}
      onConfirm={onDeleteComment}
    />
  );
};

export default DeleteCommentDialog;
