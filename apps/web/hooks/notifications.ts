'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getNotifications } from '@/lib/actions/notifications/getNotifications';
import { getUnreadNotificationsCount } from '@/lib/actions/notifications/getUnreadNotificationsCount';

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
