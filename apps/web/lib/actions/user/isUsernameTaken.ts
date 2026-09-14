import { api } from '@/lib/axios';

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const { data } = await api.get<boolean>('/users/username-taken', {
    params: { username },
  });

  return data;
};
