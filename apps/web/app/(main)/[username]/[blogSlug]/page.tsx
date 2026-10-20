import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { SITE_NAME } from '@/lib/constants';
import { getBlogPath } from '@/lib/routes';
import { getBlogBySlug } from '@/lib/actions/blogs/getBlogBySlug';
import BlogContent from './_components/blog-content';

type BlogPageParams = Promise<{ username: string; blogSlug: string }>;

export const generateMetadata = async ({
  params,
}: {
  params: BlogPageParams;
}): Promise<Metadata> => {
  const { blogSlug } = await params;
  const data = blogSlug ? await getBlogBySlug(blogSlug) : null;

  // The page renders the 404 in this case, whose own metadata isn't applied after `notFound()`.
  if (!data) return { title: 'Page not found' };

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
  const url = getBlogPath(author.name, slug);
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

const BlogPage = async ({ params }: { params: BlogPageParams }) => {
  const { username, blogSlug } = await params;
  // Shared with `generateMetadata` through `cache`, so this is not a second fetch.
  const data = blogSlug ? await getBlogBySlug(blogSlug) : null;

  if (!data) notFound();

  // A wrong or missing `@username` still finds the blog, so send it to the
  // canonical URL rather than serving duplicates.
  if (decodeURIComponent(username) !== `@${data.blog.author.name}`) {
    redirect(getBlogPath(data.blog.author.name, blogSlug));
  }

  return <BlogContent data={data} blogSlug={blogSlug} />;
};

export default BlogPage;
