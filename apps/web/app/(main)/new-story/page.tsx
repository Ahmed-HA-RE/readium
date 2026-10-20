import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import BlogForm from '@/components/shared/blog-form';

export const metadata: Metadata = {
  title: 'Write a story',
  description:
    'Draft a new story, add a cover image and tags, and publish it when it is ready.',
};

const NewStoryPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  // Admins moderate stories rather than write them; the API refuses them too.
  if (session.user.role === 'admin') redirect(ADMIN_OVERVIEW_PATH);

  // `BlogForm` owns its page container, so the draft alert can span the width.
  return (
    <BlogForm
      authorName={session.user.name}
      canMarkPro={session.user.isPro}
    />
  );
};

export default NewStoryPage;
