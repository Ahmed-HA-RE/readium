import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ADMIN_OVERVIEW_PATH, getBlogPath } from '@/lib/routes';
import { getBlogBySlug } from '@/lib/actions/blogs/getBlogBySlug';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import BlogForm from '@/components/shared/blog-form';

type EditStoryParams = Promise<{ blogSlug: string }>;

export const generateMetadata = async ({
  params,
}: {
  params: EditStoryParams;
}): Promise<Metadata> => {
  const { blogSlug } = await params;
  const data = await getBlogBySlug(blogSlug);

  // The page redirects in this case, so there is nothing to describe.
  if (!data) return {};

  return {
    title: `Edit: ${data.blog.title}`,
    description: data.blog.shortDescription,
    robots: { index: false, follow: false },
  };
};

const EditStoryPage = async ({ params }: { params: EditStoryParams }) => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  // Admins moderate stories rather than write them; the API refuses them too.
  if (session.user.role === 'admin') redirect(ADMIN_OVERVIEW_PATH);

  const { blogSlug } = await params;
  const data = await getBlogBySlug(blogSlug);

  if (!data) redirect('/');
  if (data.blog.authorId !== session.user.id) {
    redirect(getBlogPath(data.blog.author.name, blogSlug));
  }

  // `BlogForm` owns its page container, so the draft alert can span the width.
  return (
    <BlogForm
      authorName={session.user.name}
      blog={data.blog}
      canMarkPro={session.user.isPro}
      moderation={data.moderation}
    />
  );
};

export default EditStoryPage;
