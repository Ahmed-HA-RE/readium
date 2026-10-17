import type { GetBlogBySlugResponse } from '@repo/types';
import { SITE_URL } from '@/lib/constants';
import { getBlogPath } from '@/lib/utils';
import { sanitizeBlogHtml } from '@/lib/sanitize-html';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import BlogArticle from '@/components/shared/blog-article';
import BlogActionBar from './blog-action-bar';
import BlogPaywall from './blog-paywall';
import CommentsSection from './comments-section';

type BlogContentProps = {
  data: GetBlogBySlugResponse;
  blogSlug: string;
};

// Serves the author and every reader; `isOwnBlog` decides which actions show.
// The page has already fetched the blog and handled both redirects.
const BlogContent = async ({ data, blogSlug }: BlogContentProps) => {
  const session = await getCurrentLoggedInUser();

  const {
    blog,
    isLikedByLoggedInUser,
    isBookmarkedByLoggedInUser,
    isContentLocked,
    wordCount,
  } = data;

  const isSignedIn = Boolean(session);
  const isOwnBlog = blog.authorId === session?.user.id;
  const isAdmin = session?.user.role === 'admin';

  const viewer = session
    ? {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        isPro: session.user.isPro,
      }
    : null;

  return (
    <BlogArticle
      blog={blog}
      html={sanitizeBlogHtml(blog.content)}
      wordCount={wordCount}
      actions={
        <BlogActionBar
          slug={blogSlug}
          // From `SITE_URL`, so it is localhost in development and the public domain in production.
          shareUrl={new URL(
            getBlogPath(blog.author.name, blogSlug),
            SITE_URL,
          ).toString()}
          title={blog.title}
          shortDescription={blog.shortDescription}
          authorName={blog.author.name}
          counts={blog._count}
          isLikedByLoggedInUser={isLikedByLoggedInUser}
          isBookmarkedByLoggedInUser={isBookmarkedByLoggedInUser}
          isOwnBlog={isOwnBlog}
          isAdmin={isAdmin}
          isSignedIn={isSignedIn}
          // Reporting is `@Roles(['user'])` and rejects your own blog. A blog the
          // viewer already reported never reaches this page.
          canReport={isSignedIn && !isAdmin && !isOwnBlog}
        />
      }
      paywall={isContentLocked && <BlogPaywall isSignedIn={isSignedIn} />}
      // Fetched on the client, so a `router.refresh()` after a like or a new
      // comment re-renders the article without resetting the loaded pages.
      comments={
        <CommentsSection
          slug={blogSlug}
          commentsCount={blog._count.comments}
          viewer={viewer}
        />
      }
    />
  );
};

export default BlogContent;
