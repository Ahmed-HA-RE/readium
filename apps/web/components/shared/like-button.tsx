'use client';

import { useOptimistic, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn, getErrorMessage } from '@/lib/utils';
import { likeBlog } from '@/lib/actions/blogs/likeBlog';
import { unlikeBlog } from '@/lib/actions/blogs/unlikeBlog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// The burst played on a like: each spark flies `distance` px out along `angle`.

const SPARKS = [
  { angle: 0, distance: 28, delay: 0 },
  { angle: 60, distance: 24, delay: 0.04 },
  { angle: 120, distance: 30, delay: 0.02 },
  { angle: 180, distance: 26, delay: 0.06 },
  { angle: 240, distance: 28, delay: 0.01 },
  { angle: 300, distance: 25, delay: 0.05 },
].map(({ angle, distance, delay }) => ({
  angle,
  delay,
  x: Math.round(Math.cos((angle * Math.PI) / 180) * distance),
  y: Math.round(Math.sin((angle * Math.PI) / 180) * distance),
}));

// Why the viewer can't like this story, or undefined when they can.
export const getLikeDisabledReason = ({
  isOwnBlog,
  isAdmin,
}: {
  isOwnBlog: boolean;
  isAdmin: boolean;
}) =>
  isOwnBlog
    ? "You can't like your own story"
    : isAdmin
      ? "Admins can't like stories"
      : undefined;

type LikeButtonProps = {
  slug: string;
  likesCount: number;
  isLikedByLoggedInUser: boolean;
  disabledReason?: string;
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
  disabledReason,
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
      {/* The author or an admin still sees the tally, just not a control the
          endpoint would reject. */}
      {disabledReason ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost-plain'
                size='icon'
                aria-label={disabledReason}
                className='cursor-default text-muted-foreground hover:text-muted-foreground'
              />
            }
          >
            <FaRegHeart aria-hidden />
          </TooltipTrigger>
          <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
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
          <span className='relative flex items-center justify-center'>
            <motion.span
              initial={false}
              animate={{
                scale: isLikedOptimistic
                  ? [1, 0.7, 1.35, 1.05, 1]
                  : [1, 0.9, 1],
              }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className='flex'
            >
              {isLikedOptimistic ? (
                <FaHeart className='text-red-600' />
              ) : (
                <FaRegHeart />
              )}
            </motion.span>

            <AnimatePresence initial={false}>
              {isLikedOptimistic && (
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 flex items-center justify-center'
                >
                  {SPARKS.map(({ angle, x, y, delay }) => (
                    <motion.span
                      key={angle}
                      className='absolute size-1.5 rounded-full bg-red-600'
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x,
                        y,
                        scale: [0, 1.2, 0.8, 0],
                        opacity: [1, 1, 0.6, 0],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
                    />
                  ))}
                </span>
              )}
            </AnimatePresence>
          </span>
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
