import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { SearchParams } from 'nuqs/server';
import { ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import { loadListsSearchParams, type ListsTab } from '@/lib/search-params';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getMyLikesOrBookmarks } from '@/lib/actions/user/getMyLikesOrBookmarks';
import { getMyComments } from '@/lib/actions/user/getMyComments';
import { Skeleton } from '@/components/ui/skeleton';
import BlogCardSkeleton from '@/components/home/blog-card-skeleton';
import ListsTabs from './_components/lists-tabs';
import MyCommentCardSkeleton from './_components/my-comment-card-skeleton';

// Title only: the page is signed-in only and `robots.ts` disallows `/me/`.
export const metadata: Metadata = { title: 'Library' };

type ListsSectionProps = {
  tab: ListsTab;
  page: number;
  viewer: { id: string; name: string };
};

const ListsSection = async ({ tab, page, viewer }: ListsSectionProps) => {
  const queryClient = new QueryClient();

  // Literal twins of the keys in `useMyComments` and `useMyLikesOrBookmarks`.
  // `query` and `infiniteQuery` throw, so each failure is caught and falls to the list's error state.
  if (tab === 'comments') {
    await queryClient
      .infiniteQuery({
        queryKey: ['comments', 'me'],
        queryFn: ({ pageParam }) => getMyComments(pageParam),
        initialPageParam: undefined as string | undefined,
      })
      .catch(() => undefined);
  } else {
    await queryClient
      .query({
        queryKey: ['blogs', 'me', tab, { page }],
        queryFn: () => getMyLikesOrBookmarks(tab, page),
      })
      .catch(() => undefined);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListsTabs viewer={viewer} />
    </HydrationBoundary>
  );
};

const ListsPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  if (session.user.role === 'admin') redirect(ADMIN_OVERVIEW_PATH);

  const { tab, page } = await loadListsSearchParams(searchParams);
  const viewer = { id: session.user.id, name: session.user.name };

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
      <h1 className='pb-6 text-3xl font-bold tracking-tight'>Your library</h1>

      <Suspense
        fallback={
          <>
            <div className='flex gap-2 border-b py-3'>
              <Skeleton className='h-6 w-28' />
              <Skeleton className='h-6 w-20' />
              <Skeleton className='h-6 w-28' />
            </div>
            {tab === 'comments' ? (
              <MyCommentCardSkeleton />
            ) : (
              <BlogCardSkeleton />
            )}
          </>
        }
      >
        <ListsSection tab={tab} page={page} viewer={viewer} />
      </Suspense>
    </div>
  );
};

export default ListsPage;
