import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { SearchParams } from 'nuqs/server';
import type { BlogAuthor } from '@repo/types';
import { cn } from '@/lib/utils';
import { ADMIN_OVERVIEW_PATH, NEW_STORY_PATH } from '@/lib/routes';
import { loadMyStoriesSearchParams } from '@/lib/search-params';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import {
  getMyBlogs,
  type GetMyBlogsParams,
} from '@/lib/actions/user/getMyBlogs';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BlogCardSkeleton from '@/components/home/blog-card-skeleton';
import StoriesTabs from './_components/stories-tabs';
import MyStoriesList from './_components/my-stories-list';

// Title only: the page is signed-in only and `robots.ts` disallows `/me/`.
export const metadata: Metadata = { title: 'Stories' };

type MyStoriesSectionProps = {
  params: GetMyBlogsParams;
  author: Pick<BlogAuthor, 'name' | 'image'>;
};

const MyStoriesSection = async ({ params, author }: MyStoriesSectionProps) => {
  const { status, search, sort, page } = params;
  const queryClient = new QueryClient();

  await queryClient.query({
    queryKey: ['blogs', 'me', status, { search, sort, page }],
    queryFn: () => getMyBlogs(params),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StoriesTabs>
        <MyStoriesList author={author} />
      </StoriesTabs>
    </HydrationBoundary>
  );
};

const MyStoriesPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  // Admins don't write, so they have no stories to list.
  if (session.user.role === 'admin') redirect(ADMIN_OVERVIEW_PATH);

  const params = await loadMyStoriesSearchParams(searchParams);
  const author = { name: session.user.name, image: session.user.image };

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex items-center justify-between gap-4 pb-6'>
        <h1 className='text-3xl font-bold tracking-tight'>Stories</h1>

        <Link
          href={NEW_STORY_PATH}
          className={cn(buttonVariants({ size: 'lg' }), 'rounded-full')}
        >
          Create a story
        </Link>
      </div>

      <Suspense
        fallback={
          <>
            <div className='flex gap-2 border-b py-3'>
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-6 w-28' />
            </div>
            <BlogCardSkeleton />
          </>
        }
      >
        <MyStoriesSection params={params} author={author} />
      </Suspense>
    </div>
  );
};

export default MyStoriesPage;
