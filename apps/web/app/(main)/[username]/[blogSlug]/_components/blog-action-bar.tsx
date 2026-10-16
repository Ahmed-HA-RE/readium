'use client';

import { FaRegCommentDots } from 'react-icons/fa';
import type { Blog } from '@repo/types';
import { buttonVariants } from '@/components/ui/button';
import LikeButton, {
  getLikeDisabledReason,
} from '@/components/shared/like-button';
import BookmarkButton from '@/components/shared/bookmark-button';
import BlogActionsMenu from '@/components/shared/blog-actions-menu';
import { cn } from 'cn';
import ShareBlogDialog from './share-blog-dialog';

type BlogActionBarProps = {
  slug: string;
  shareUrl: string;
  title: string;
  shortDescription: string;
  authorName: string;
  counts: Blog['_count'];
  isLikedByLoggedInUser: boolean;
  isBookmarkedByLoggedInUser: boolean;
  isOwnBlog: boolean;
  isAdmin: boolean;
  isSignedIn: boolean;
  canReport: boolean;
};

// Every value comes from the server render, so the buttons refresh the router
// after a change rather than relying on a client query.
const BlogActionBar = ({
  slug,
  shareUrl,
  title,
  shortDescription,
  authorName,
  counts,
  isLikedByLoggedInUser,
  isBookmarkedByLoggedInUser,
  isOwnBlog,
  isAdmin,
  isSignedIn,
  canReport,
}: BlogActionBarProps) => (
  <div className='flex items-center justify-between border-y py-1.5'>
    <div className='flex items-center gap-4'>
      <LikeButton
        slug={slug}
        likesCount={counts.likes}
        isLikedByLoggedInUser={isLikedByLoggedInUser}
        disabledReason={getLikeDisabledReason({ isOwnBlog, isAdmin })}
        isSignedIn={isSignedIn}
        refreshOnChange
      />

      <a
        href='#comments'
        aria-label={`${counts.comments} responses`}
        className={cn(
          'text-muted-foreground hover:text-foreground',
          buttonVariants({ variant: 'ghost-plain', size: 'icon' }),
        )}
      >
        <FaRegCommentDots />
        {counts.comments > 0 && counts.comments}
      </a>
    </div>

    <div className='flex items-center gap-1'>
     
      {!isAdmin && (
        <BookmarkButton
          slug={slug}
          isBookmarkedByLoggedInUser={isBookmarkedByLoggedInUser}
          isSignedIn={isSignedIn}
          refreshOnChange
        />
      )}

      <ShareBlogDialog
        url={shareUrl}
        title={title}
        shortDescription={shortDescription}
        authorName={authorName}
      />

      {(isOwnBlog || canReport) && (
        <BlogActionsMenu
          slug={slug}
          title={title}
          counts={counts}
          isOwnBlog={isOwnBlog}
          redirectOnDelete='/me/stories'
        />
      )}
    </div>
  </div>
);

export default BlogActionBar;
