import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
  MarkAllNotificationsAsReadResponse,
  Notification,
  NotificationType,
} from '@repo/types';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationQueryDto } from './dto/notification-query-dto';
import { S3ServiceService } from '../s3-service/s3-service.service';
import {
  notificationInclude,
  type NotificationWithRelations,
} from './utils/notification-query';

const NOTIFICATIONS_PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly s3Service: S3ServiceService,
  ) {}

  private readonly logger = new Logger(NotificationsService.name);

  // Prisma and @repo/types each declare a NotificationType enum, so the row's type needs a cast.
  // `actor.image` is an S3 key, except for OAuth sign-ups where it is already a full URL.
  private async toNotification(
    row: NotificationWithRelations,
  ): Promise<Notification> {
    const { image } = row.actor;
    const isStoredKey =
      image && !image.startsWith('http://') && !image.startsWith('https://');

    return {
      ...row,
      type: row.type as NotificationType,
      actor: {
        ...row.actor,
        image: isStoredKey ? await this.s3Service.getSignedUrl(image) : image,
      },
    };
  }

  async createLikeNotification(
    actorId: string,
    recipientId: string,
    blogId: string,
  ): Promise<Notification | null> {
    // The like is already saved, so a failure here is logged instead of failing the request.
    try {
      const row = await this.prisma.notification.create({
        data: {
          type: 'NEW_LIKE',
          actorId,
          recipientId,
          blogId,
        },
        include: notificationInclude,
      });
      const notification = await this.toNotification(row);

      this.notificationsGateway.sendNotification(notification);

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to create the like notification for blog ${blogId}`,
        error,
      );
      return null;
    }
  }

  async createCommentNotification(
    actorId: string,
    recipientId: string,
    blogId: string,
    commentId: string,
  ): Promise<Notification | null> {
    // Do not create a notification if the actor is the author of the blog post.
    if (actorId === recipientId) {
      return null;
    }

    try {
      const row = await this.prisma.notification.create({
        data: {
          type: 'NEW_COMMENT',
          actorId,
          recipientId,
          blogId,
          commentId,
        },
        include: notificationInclude,
      });
      const notification = await this.toNotification(row);

      this.notificationsGateway.sendNotification(notification);

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to create the comment notification for comment ${commentId}`,
        error,
      );
      return null;
    }
  }

  async createReportNotificationForAdmins(
    reporterId: string,
    blogId: string,
    reportId: string,
  ): Promise<Notification[]> {
    try {
      const rows = await this.prisma.$transaction(async (tx) => {
        const admins = await tx.user.findMany({
          where: {
            role: 'admin',
          },
          select: {
            id: true,
          },
        });

        const newNotifications = await tx.notification.createManyAndReturn({
          data: admins.map((admin) => ({
            type: 'NEW_REPORT',
            actorId: reporterId,
            recipientId: admin.id,
            blogId,
            reportId,
          })),
          include: notificationInclude,
        });

        return Promise.all(
          newNotifications.map((row) => this.toNotification(row)),
        );
      });

      for (const notification of rows) {
        this.notificationsGateway.sendNotification(notification);
      }
      return rows;
    } catch (error) {
      this.logger.error(
        `Failed to create the report notifications for report ${reportId}`,
        error,
      );
      return [];
    }
  }
  async deleteLikeNotification(
    actorId: string,
    recipientId: string,
    blogId: string,
  ): Promise<void> {
    try {
      await this.prisma.notification.deleteMany({
        where: {
          type: 'NEW_LIKE',
          actorId,
          recipientId,
          blogId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete the like notification for blog ${blogId}`,
        error,
      );
    }
  }

  async getNotifications(
    recipientId: string,
    query: NotificationQueryDto,
  ): Promise<GetNotificationsResponse> {
    const { cursor } = query;

    const rows = await this.prisma.notification.findMany({
      where: { recipientId },
      take: NOTIFICATIONS_PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: notificationInclude,
    });

    return {
      data: await Promise.all(rows.map((row) => this.toNotification(row))),
      // Only a full page can have more after it; a short page ends the feed.
      nextCursor:
        rows.length === NOTIFICATIONS_PAGE_SIZE
          ? rows[rows.length - 1].id
          : null,
    };
  }

  async getUnreadCount(
    recipientId: string,
  ): Promise<GetUnreadNotificationsCountResponse> {
    const count = await this.prisma.notification.count({
      where: { recipientId, isRead: false },
    });

    return { count };
  }

  async markAsRead(
    recipientId: string,
    notificationId: string,
  ): Promise<Notification> {
    // Scoped to the recipient, so another user's notification id is a 404 rather than a write.
    const [row] = await this.prisma.notification.updateManyAndReturn({
      where: { id: notificationId, recipientId },
      data: { isRead: true },
      include: notificationInclude,
    });

    if (!row) {
      throw new NotFoundException(
        `Notification with id ${notificationId} does not exist`,
      );
    }

    return this.toNotification(row);
  }

  async markAllAsRead(
    recipientId: string,
  ): Promise<MarkAllNotificationsAsReadResponse> {
    const { count } = await this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });

    return { count };
  }
}
