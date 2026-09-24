import { redirect } from 'next/navigation';
import { sanitizeBlogHtml } from '@/lib/sanitize-html';
import { getBlogBySlug } from '@/lib/actions/blogs/getBlogBySlug';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import BlogArticle from '@/components/shared/blog-article';
import BlogActionBar from './blog-action-bar';
import CommentsSection from './comments-section';

type PublicBlogContentProps = {
  params: Promise<{ blogSlug: string }>;
};

const PublicBlogContent = async ({ params }: PublicBlogContentProps) => {
  const { blogSlug } = await params;
  const data = await getBlogBySlug(blogSlug);

  if (!blogSlug || !data) redirect('/');

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
          likesCount={blog._count.likes}
          commentsCount={blog._count.comments}
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

export default PublicBlogContent;
