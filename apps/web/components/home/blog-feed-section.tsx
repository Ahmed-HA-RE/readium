import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { SearchParams } from 'nuqs/server';
import { loadBlogFeedSearchParams } from '@/lib/search-params';
import { getAllBlogs } from '@/lib/actions/blogs/getAllBlogs';
import BlogFeed from './blog-feed';

type BlogFeedSectionProps = {
  searchParams: Promise<SearchParams>;
};

const BlogFeedSection = async ({ searchParams }: BlogFeedSectionProps) => {
  const { sort, page } = await loadBlogFeedSearchParams(searchParams);

  const queryClient = new QueryClient();

  // The key is the literal twin of the one in `useAllBlogs`; if the two drift
  // the client refetches instead of reading this cache.
  await queryClient.prefetchQuery({
    queryKey: ['blogs', { sort, page }],
    queryFn: () => getAllBlogs({ sort, page }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlogFeed />
    </HydrationBoundary>
  );
};

export default BlogFeedSection;
