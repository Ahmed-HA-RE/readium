import type { CreateBlogResponse } from '@repo/types';
import type { CreateBlogValues } from '@/schema/blog';
import { api } from '@/lib/axios';

// `tags` is sent as JSON because `CreateBlogDto` parses it back into an array.
export const createBlog = async ({
  title,
  shortDescription,
  content,
  coverImage,
  tags,
  isPublished = false,
}: CreateBlogValues): Promise<CreateBlogResponse['data']> => {
  const formData = new FormData();

  formData.append('title', title);
  formData.append('shortDescription', shortDescription);
  formData.append('content', content);
  // Optional: appending `undefined` would send the string "undefined".
  if (coverImage) formData.append('coverImage', coverImage);
  formData.append('tags', JSON.stringify(tags));
  formData.append('isPublished', String(isPublished));

  const { data } = await api.post<CreateBlogResponse>('/blogs', formData);

  return data.data;
};
