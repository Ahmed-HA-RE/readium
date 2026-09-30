'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';

export type UpdateUserProfileInput = {
  name?: string;
  bio?: string;
  website?: string;
  image?: File;
};

// Only the fields passed are sent, so the backend leaves every other column alone.
export const updateUserProfile = async ({
  name,
  bio,
  website,
  image,
}: UpdateUserProfileInput): Promise<{ error?: string }> => {
  const formData = new FormData();

  if (name !== undefined) formData.append('name', name);
  // An empty string clears the field on the backend.
  if (bio !== undefined) formData.append('bio', bio);
  if (website !== undefined) formData.append('website', website);
  if (image) formData.append('image', image);

  try {
    await api.put('/users/me', formData, {
      headers: { Cookie: (await cookies()).toString() },
    });

    return {};
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not update your profile') };
  }
};
