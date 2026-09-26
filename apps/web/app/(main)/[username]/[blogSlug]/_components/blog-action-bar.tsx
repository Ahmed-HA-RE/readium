'use client';

import { FaRegCommentDots } from 'react-icons/fa';
import { IoShareOutline } from 'react-icons/io5';
import { Button, buttonVariants } from '@/components/ui/button';
import LikeButton from '@/components/shared/like-button';
import BookmarkButton from '@/components/shared/bookmark-button';
import BlogActionsMenu from '@/components/shared/blog-actions-menu';
import { cn } from 'cn';

type BlogActionBarProps = {
  slug: string;
  likesCount: number;
  commentsCount: number;
  isLikedByLoggedInUser: boolean;
  isBookmarkedByLoggedInUser: boolean;
  isOwnBlog: boolean;
  isSignedIn: boolean;
  canReport: boolean;
};

// Every value comes from the server render, so the buttons refresh the router
// after a change rather than relying on a client query.
const BlogActionBar = ({
  slug,
  likesCount,
  commentsCount,
  isLikedByLoggedInUser,
  isBookmarkedByLoggedInUser,
  isOwnBlog,
  isSignedIn,
  canReport,
}: BlogActionBarProps) => (
  <div className='flex items-center justify-between border-y py-1.5'>
    <div className='flex items-center gap-4'>
      <LikeButton
        slug={slug}
        likesCount={likesCount}
        isLikedByLoggedInUser={isLikedByLoggedInUser}
        isOwnBlog={isOwnBlog}
        isSignedIn={isSignedIn}
        refreshOnChange
      />

    
      <a
        href='#comments'
        aria-label={`${commentsCount} responses`}
        className={cn(
          'text-muted-foreground hover:text-foreground',
          buttonVariants({ variant: 'ghost-plain', size: 'icon' }),
        )}
      >
        <FaRegCommentDots />
        {commentsCount > 0 && commentsCount}
      </a>
    </div>

    <div className='flex items-center gap-1'>
      <BookmarkButton
        slug={slug}
        isBookmarkedByLoggedInUser={isBookmarkedByLoggedInUser}
        isSignedIn={isSignedIn}
        refreshOnChange
      />

      {/* Placeholder until the share dialog ships. */}
      <Button variant='ghost-plain' className='text-muted-foreground'>
        <IoShareOutline />
        Share
      </Button>

      {(isOwnBlog || canReport) && (
        <BlogActionsMenu slug={slug} isOwnBlog={isOwnBlog} />
      )}
    </div>
  </div>
);

export default BlogActionBar;
