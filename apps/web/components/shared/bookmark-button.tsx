'use client';

import { useOptimistic, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FaBookmark } from 'react-icons/fa';
import { LuBookmarkPlus } from 'react-icons/lu';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn, getErrorMessage } from '@/lib/utils';
import { bookmarkBlog } from '@/lib/actions/blogs/bookmarkBlog';
import { unbookmarkBlog } from '@/lib/actions/blogs/unbookmarkBlog';
import { Button } from '@/components/ui/button';

type BookmarkButtonProps = {
  slug: string;
  isBookmarkedByLoggedInUser: boolean;
  // Anonymous readers are sent to sign in, since the endpoint would 401.
  isSignedIn?: boolean;
  // For server-rendered props, which only change after a router refresh.
  refreshOnChange?: boolean;
  className?: string;
};

const BookmarkButton = ({
  slug,
  isBookmarkedByLoggedInUser,
  isSignedIn = true,
  refreshOnChange = false,
  className,
}: BookmarkButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const [isBookmarking, startBookmarking] = useTransition();
  const [isBookmarkedOptimistic, setIsBookmarkedOptimistic] = useOptimistic(
    isBookmarkedByLoggedInUser,
  );

  const toggleBookmark = () => {
    if (!isSignedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const nextIsBookmarked = !isBookmarkedOptimistic;

    startBookmarking(async () => {
      setIsBookmarkedOptimistic(nextIsBookmarked);

      // Same guard as the like: the endpoint 400s on a state it is already in.
      if (isBookmarking) return;

      try {
        await (nextIsBookmarked ? bookmarkBlog(slug) : unbookmarkBlog(slug));
        await queryClient.invalidateQueries({ queryKey: ['blogs'] });
        if (refreshOnChange) router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not update your bookmark'));
      }
    });
  };

  return (
    <Button
      variant='ghost-plain'
      size='icon'
      onClick={toggleBookmark}
      aria-pressed={isBookmarkedOptimistic}
      aria-label={isBookmarkedOptimistic ? 'Remove bookmark' : 'Bookmark'}
      className={cn(
        isBookmarkedOptimistic
          ? 'text-blue-600 hover:text-blue-600'
          : 'text-muted-foreground hover:text-blue-600',
        className,
      )}
    >
      {isBookmarkedOptimistic ? <FaBookmark /> : <LuBookmarkPlus />}
    </Button>
  );
};

export default BookmarkButton;
