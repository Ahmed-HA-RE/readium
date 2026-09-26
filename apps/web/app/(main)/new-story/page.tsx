import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import BlogForm from '@/components/shared/blog-form';

export const metadata: Metadata = {
  title: 'Write a story',
  description:
    'Draft a new story, add a cover image and tags, and publish it when it is ready.',
};

const NewStoryPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
      <BlogForm authorName={session.user.name} />
    </div>
  );
};

export default NewStoryPage;
