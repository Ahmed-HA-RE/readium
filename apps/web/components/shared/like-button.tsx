'use client';

import { useOptimistic, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn, getErrorMessage } from '@/lib/utils';
import { likeBlog } from '@/lib/actions/blogs/likeBlog';
import { unlikeBlog } from '@/lib/actions/blogs/unlikeBlog';
import { Button } from '@/components/ui/button';

type LikeButtonProps = {
  slug: string;
  likesCount: number;
  isLikedByLoggedInUser: boolean;
  isOwnBlog: boolean;
  // Anonymous readers are sent to sign in, since the endpoint would 401.
  isSignedIn?: boolean;
  // For server-rendered props, which only change after a router refresh.
  refreshOnChange?: boolean;
  className?: string;
};

const LikeButton = ({
  slug,
  likesCount,
  isLikedByLoggedInUser,
  isOwnBlog,
  isSignedIn = true,
  refreshOnChange = false,
  className,
}: LikeButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const [isLiking, startLiking] = useTransition();
  const [isLikedOptimistic, setIsLikedOptimistic] = useOptimistic(
    isLikedByLoggedInUser,
  );

  // Zero unless the UI is a click ahead of the server, which is the only case
  // where `likesCount` does not already account for the reader's own like.
  const pendingLikeDelta =
    isLikedOptimistic === isLikedByLoggedInUser
      ? 0
      : isLikedOptimistic
        ? 1
        : -1;
  const displayedCount = likesCount + pendingLikeDelta;

  const toggleLike = () => {
    if (!isSignedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const nextIsLiked = !isLikedOptimistic;

    startLiking(async () => {
      setIsLikedOptimistic(nextIsLiked);

      // The optimistic flip above still lands; only the request is skipped,
      // because the endpoint 400s on a state it is already in.
      if (isLiking) return;

      try {
        await (nextIsLiked ? likeBlog(slug) : unlikeBlog(slug));
        await queryClient.invalidateQueries({ queryKey: ['blogs'] });
        if (refreshOnChange) router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not update your like'));
      }
    });
  };

  return (
    <span className={cn('flex items-center', className)}>
      {/* The author still sees the tally, just not a control the endpoint
          would reject. */}
      {isOwnBlog ? (
        <span className='flex size-8 items-center justify-center text-muted-foreground'>
          <FaRegHeart className='size-4.5' />
        </span>
      ) : (
        <Button
          variant='ghost-plain'
          size='icon'
          onClick={toggleLike}
          aria-pressed={isLikedOptimistic}
          aria-label={isLikedOptimistic ? 'Unlike' : 'Like'}
          className={cn(
            !isLikedOptimistic && 'text-muted-foreground hover:text-red-600',
          )}
        >
          {isLikedOptimistic ? (
            <FaHeart className='text-red-600' />
          ) : (
            <FaRegHeart />
          )}
        </Button>
      )}
      {displayedCount > 0 && (
        <span className='mr-2 text-sm text-muted-foreground'>
          {displayedCount}
        </span>
      )}
    </span>
  );
};

export default LikeButton;
