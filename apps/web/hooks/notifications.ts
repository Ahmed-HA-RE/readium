'use client';

import { useTransition } from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getNotifications } from '@/lib/actions/notifications/getNotifications';
import { getUnreadNotificationsCount } from '@/lib/actions/notifications/getUnreadNotificationsCount';
import { markAllNotificationsAsRead } from '@/lib/actions/notifications/markAllNotificationsAsRead';
import { markNotificationAsRead } from '@/lib/actions/notifications/markNotificationAsRead';
import {
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
} from '@/lib/notifications';

// Always enabled, since the bell's dot needs it on every page. `NotificationSocket` keeps it live.
export const useUnreadNotificationsCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadNotificationsCount(),
  });

// The dropdown enables it only once opened; the notifications pages pass `true`.
export const useNotifications = (enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    // The backend sends `null` once a page comes back short.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

// Shared by the dropdown rows and the page cards, so both update the same caches.
export const useMarkNotificationAsRead = (notificationId: string) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const markAsRead = () =>
    startTransition(async () => {
      const { error } = await markNotificationAsRead(notificationId);
      if (error) {
        toast.error(error);
        return;
      }
      markNotificationReadInCache(queryClient, notificationId);
    });

  return { markAsRead, isPending };
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const markAllAsRead = () =>
    startTransition(async () => {
      const { error } = await markAllNotificationsAsRead();
      if (error) {
        toast.error(error);
        return;
      }
      markAllNotificationsReadInCache(queryClient);
    });

  return { markAllAsRead, isPending };
};
