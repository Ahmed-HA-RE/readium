import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getBlogPath } from '@/lib/utils';
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

  const { blogSlug } = await params;
  const data = await getBlogBySlug(blogSlug);

  if (!data) redirect('/');
  if (data.blog.authorId !== session.user.id) {
    redirect(getBlogPath(data.blog.author.name, blogSlug));
  }

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
      <BlogForm authorName={session.user.name} blog={data.blog} />
    </div>
  );
};

export default EditStoryPage;
