'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaEye, FaEyeSlash, FaGlobe, FaTrash } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmDeleteDialog from '@/components/shared/confirm-delete-dialog';
import { updateAdminBlogStatus } from '@/lib/actions/admin/updateAdminBlogStatus';
import { deleteAdminBlog } from '@/lib/actions/admin/deleteAdminBlog';
import { getAdminBlogPath } from '@/lib/routes';

const ICON_CLASS = 'size-4';

type BlogActionsMenuProps = {
  slug: string;
  title: string;
  isPublished: boolean;
  banLocked: boolean;
};

const BlogActionsMenu = ({
  slug,
  title,
  isPublished,
  banLocked,
}: BlogActionsMenuProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdating, startUpdate] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();

  const toggleStatus = () =>
    startUpdate(async () => {
      const { error } = await updateAdminBlogStatus({
        slug,
        isPublished: !isPublished,
      });

      if (error) {
        toast.error(error);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success(isPublished ? 'Story unpublished' : 'Story published');
    });

  const onDelete = async () => {
    const { error } = await deleteAdminBlog(slug);

    if (error) {
      toast.error(error);
      return;
    }

    // Comments too, since the comment lists link each one to its blog.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['blogs'] }),
      queryClient.invalidateQueries({ queryKey: ['comments'] }),
    ]);
    toast.success('Story deleted successfully');
    setIsDeleteOpen(false);
    // The server-rendered analytics cards count the blogs.
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label={`Actions for ${title}`}
            />
          }
        >
          <BsThreeDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-44'>
          <DropdownMenuItem
            render={
              <Link
                href={getAdminBlogPath(slug)}
              />
            }
          >
            <FaEye className={ICON_CLASS} />
            View Blog
          </DropdownMenuItem>
          {/* A story taken down with a ban can't be republished, so Publish isn't offered. */}
          {(isPublished || !banLocked) && (
            <DropdownMenuItem onClick={toggleStatus} disabled={isUpdating}>
              {isPublished ? (
                <>
                  <FaEyeSlash className={ICON_CLASS} />
                  Unpublish
                </>
              ) : (
                <>
                  <FaGlobe className={ICON_CLASS} />
                  Publish
                </>
              )}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => setIsDeleteOpen(true)}
          >
            <FaTrash className={ICON_CLASS} />
            Delete Blog
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        title='Delete story'
        description={`Are you sure you want to delete "${title}"? This action can't be undone.`}
        open={isDeleteOpen}
        setOpen={setIsDeleteOpen}
        onConfirm={onDelete}
      />
    </>
  );
};

export default BlogActionsMenu;
