import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/constants';
import { getBlogPath } from '@/lib/utils';
import { sanitizeBlogHtml } from '@/lib/sanitize-html';
import { getBlogBySlug } from '@/lib/actions/blogs/getBlogBySlug';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import BlogArticle from '@/components/shared/blog-article';
import BlogActionBar from './blog-action-bar';
import CommentsSection from './comments-section';

export type BlogPageParams = Promise<{ username: string; blogSlug: string }>;

type BlogContentProps = {
  params: BlogPageParams;
};

// Serves the author and every reader; `isOwnBlog` decides which actions show.
const BlogContent = async ({ params }: BlogContentProps) => {
  const { username, blogSlug } = await params;
  const data = await getBlogBySlug(blogSlug);

  if (!blogSlug || !data) redirect('/');

  // A wrong or missing `@username` still finds the blog, so send it to the
  // canonical URL rather than serving duplicates.
  if (decodeURIComponent(username) !== `@${data.blog.author.name}`) {
    redirect(getBlogPath(data.blog.author.name, blogSlug));
  }

  const session = await getCurrentLoggedInUser();

  const { blog, isLikedByLoggedInUser, isBookmarkedByLoggedInUser } = data;

  const isSignedIn = Boolean(session);
  const isOwnBlog = blog.authorId === session?.user.id;
  const isAdmin = session?.user.role === 'admin';

  const viewer = session
    ? {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <BlogArticle
      blog={blog}
      html={sanitizeBlogHtml(blog.content)}
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
          isSignedIn={isSignedIn}
          // Reporting is `@Roles(['user'])` and rejects your own blog. A blog the
          // viewer already reported never reaches this page.
          canReport={isSignedIn && !isAdmin && !isOwnBlog}
        />
      }
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
