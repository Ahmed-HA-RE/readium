import type { UpdateMyBlogResponse } from '@repo/types';
import type { BlogValues } from '@/schema/blog';
import { api } from '@/lib/axios';

// Same body as `createBlog`, since `UpdateBlogDto` parses `tags` and `isPublished` the same way.
export const updateBlog = async (
  slug: string,
  {
    title,
    shortDescription,
    content,
    coverImage,
    tags,
    isPublished = false,
    blogPro = false,
  }: BlogValues,
): Promise<UpdateMyBlogResponse['data']> => {
  const formData = new FormData();

  formData.append('title', title);
  formData.append('shortDescription', shortDescription);
  formData.append('content', content);
  // Omitted when no new file was picked, so the backend keeps the current cover.
  if (coverImage) formData.append('coverImage', coverImage);
  formData.append('tags', JSON.stringify(tags));
  formData.append('isPublished', String(isPublished));
  formData.append('blogPro', String(blogPro));

  const { data } = await api.put<UpdateMyBlogResponse>(
    `/blogs/${encodeURIComponent(slug)}`,
    formData,
  );

  return data.data;
};
