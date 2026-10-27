import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import {
  type GetNotificationsResponse,
  type GetUnreadNotificationsCountResponse,
  type Notification,
  NotificationType,
} from '@repo/types';
import { ADMIN_REPORTS_PATH, getBlogPath } from '@/lib/routes';

// Likes and comments only ever reach the blog's author, so `username` is the signed-in user's own name.
export const getNotificationHref = (
  notification: Notification,
  username: string,
) => {
  const { type, blog, commentId, reportId } = notification;
  const blogPath = getBlogPath(username, blog.slug);

  switch (type) {
    case NotificationType.NEW_LIKE:
      return blogPath;
    case NotificationType.NEW_COMMENT:
      // The query is for the server, which pins the comment; the hash scrolls to it.
      return commentId
        ? `${blogPath}?commentId=${commentId}#comment-${commentId}`
        : blogPath;
    case NotificationType.NEW_REPORT:
      return reportId
        ? `${ADMIN_REPORTS_PATH}?reportId=${reportId}`
        : ADMIN_REPORTS_PATH;
  }
};


const updateCachedNotifications = (
  queryClient: QueryClient,
  update: (pages: GetNotificationsResponse[]) => GetNotificationsResponse[],
) =>
  queryClient.setQueryData<InfiniteData<GetNotificationsResponse>>(
    ['notifications'],
    (oldData) => oldData && { ...oldData, pages: update(oldData.pages) },
  );

const updateUnreadCount = (
  queryClient: QueryClient,
  update: (count: number) => number,
) =>
  queryClient.setQueryData<GetUnreadNotificationsCountResponse>(
    ['notifications', 'unread-count'],
    (oldData) => oldData && { count: update(oldData.count) },
  );

export const addNotificationToCache = (
  queryClient: QueryClient,
  notification: Notification,
) => {
  updateCachedNotifications(queryClient, ([firstPage, ...otherPages]) =>
    firstPage
      ? [{ ...firstPage, data: [notification, ...firstPage.data] }, ...otherPages]
      : otherPages,
  );
  updateUnreadCount(queryClient, (count) => count + 1);
};

export const markNotificationReadInCache = (
  queryClient: QueryClient,
  notificationId: string,
) => {
  updateCachedNotifications(queryClient, (pages) =>
    pages.map((page) => ({
      ...page,
      data: page.data.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    })),
  );
  updateUnreadCount(queryClient, (count) => Math.max(0, count - 1));
};

export const markAllNotificationsReadInCache = (queryClient: QueryClient) => {
  updateCachedNotifications(queryClient, (pages) =>
    pages.map((page) => ({
      ...page,
      data: page.data.map((notification) => ({ ...notification, isRead: true })),
    })),
  );
  updateUnreadCount(queryClient, () => 0);
};
