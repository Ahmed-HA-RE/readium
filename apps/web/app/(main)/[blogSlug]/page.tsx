import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { getBlogBySlug } from '@/lib/actions/blogs/getBlogBySlug';
import PublicBlogContent from './_components/public-blog-content';
import BlogPageSkeleton from './_components/blog-page-skeleton';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ blogSlug: string }>;
}): Promise<Metadata> => {
  const { blogSlug } = await params;
  const data = blogSlug ? await getBlogBySlug(blogSlug) : null;

  // The page redirects in this case, so there is nothing to describe.
  if (!data) return {};

  const {
    title,
    shortDescription,
    slug,
    tags,
    coverImage,
    createdAt,
    updatedAt,
    author,
  } = data.blog;
  const url = `/${slug}`;
  const images = coverImage ? [{ url: coverImage, alt: title }] : undefined;

  return {
    title,
    description: shortDescription,
    keywords: tags,
    authors: [{ name: author.name }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description: shortDescription,
      publishedTime: new Date(createdAt).toISOString(),
      modifiedTime: new Date(updatedAt).toISOString(),
      authors: [author.name],
      tags,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: shortDescription,
      images,
    },
  };
};

// `params` is passed down rather than awaited here, so the skeleton renders
// immediately and only the article suspends.
const BlogPage = ({ params }: { params: Promise<{ blogSlug: string }> }) => (
  <Suspense fallback={<BlogPageSkeleton />}>
    <PublicBlogContent params={params} />
  </Suspense>
);

export default BlogPage;
