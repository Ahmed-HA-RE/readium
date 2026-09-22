import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { SearchParams } from 'nuqs/server';
import { loadBlogFeedSearchParams } from '@/lib/search-params';
import { getAllBlogs } from '@/lib/actions/blogs/getAllBlogs';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import BlogFeed from './blog-feed';

type BlogFeedSectionProps = {
  searchParams: Promise<SearchParams>;
};

const BlogFeedSection = async ({ searchParams }: BlogFeedSectionProps) => {
  const { sort, page } = await loadBlogFeedSearchParams(searchParams);

  // Free: `getCurrentLoggedInUser` is `cache`d, so this reuses the result the
  // page and the header already read.
  const session = await getCurrentLoggedInUser();

  const queryClient = new QueryClient();

  // The key is the literal twin of the one in `useAllBlogs`; if the two drift
  // the client refetches instead of reading this cache.
  await queryClient.prefetchQuery({
    queryKey: ['blogs', { sort, page }],
    queryFn: () => getAllBlogs({ sort, page }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlogFeed
        viewerId={session?.user.id}
        isAdmin={session?.user.role === 'admin'}
      />
    </HydrationBoundary>
  );
};

export default BlogFeedSection;
