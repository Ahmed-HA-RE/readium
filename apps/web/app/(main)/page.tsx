import { Suspense } from 'react';
import type { SearchParams } from 'nuqs/server';
import { SITE_NAME } from '@/lib/constants';
import MarketingHome from '@/components/marketing/marketing-home';
import BlogFeedSection from '@/components/home/blog-feed-section';
import BlogCardSkeleton from '@/components/home/blog-card-skeleton';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';

const HomePage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const session = await getCurrentLoggedInUser();

  if (!session) return <MarketingHome />;

  return (
    <div className='mx-auto flex w-full max-w-6xl gap-16 px-4 sm:px-6 lg:px-8'>
      {/* `searchParams` is passed down rather than awaited here, so the shell
          renders immediately and only the feed suspends. */}
      <div className='min-w-0 flex-1 py-6 lg:max-w-[680px]'>
        <Suspense fallback={<BlogCardSkeleton />}>
          <BlogFeedSection searchParams={searchParams} />
        </Suspense>
      </div>

      <aside className='hidden w-80 shrink-0 border-l py-6 pl-16 xl:block'>
        <h2 className='font-medium'>Trending on {SITE_NAME}</h2>
      </aside>
    </div>
  );
};

export default HomePage;
