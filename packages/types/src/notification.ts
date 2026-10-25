export enum NotificationType {
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_LIKE = 'NEW_LIKE',
  NEW_REPORT = 'NEW_REPORT',
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  actorId: string;
  blogId: string;
  commentId: string | null;
  reportId: string | null;
  isRead: boolean;
  createdAt: Date;
  // The user who liked, commented or reported, not the blog's author.
  actor: {
    id: string;
    name: string;
    image: string | null;
  };
  blog: {
    title: string;
    slug: string;
  };
}

export interface GetNotificationsResponse {
  data: Notification[];
  nextCursor: string | null;
}

export interface GetUnreadNotificationsCountResponse {
  count: number;
}

export interface MarkAllNotificationsAsReadResponse {
  count: number;
}
