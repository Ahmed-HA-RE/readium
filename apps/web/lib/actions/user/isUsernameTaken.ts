import { API_URL } from '@/lib/constants';

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const response = await fetch(
    `${API_URL}/users/username-taken?username=${encodeURIComponent(username)}`,
    { credentials: 'include' },
  );

  if (!response.ok) throw new Error('Could not check that name');

  return response.json();
};
