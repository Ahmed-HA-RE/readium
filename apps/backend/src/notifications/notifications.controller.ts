import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
  MarkAllNotificationsAsReadResponse,
  Notification,
} from '@repo/types';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query-dto';

// Both roles: users receive like and comment notifications, admins receive report ones.
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Method      GET /api/notifications
  // Description Get the logged-in user's notifications, newest first, 20 per page
  @Get()
  @Roles(['user', 'admin'])
  getNotifications(
    @Query() query: NotificationQueryDto,
    @Session() session: UserSession,
  ): Promise<GetNotificationsResponse> {
    const recipientId = session.user.id;
    return this.notificationsService.getNotifications(recipientId, query);
  }

  // Method      GET /api/notifications/unread-count
  // Description Get the number of unread notifications for the badge
  @Get('unread-count')
  @Roles(['user', 'admin'])
  getUnreadCount(
    @Session() session: UserSession,
  ): Promise<GetUnreadNotificationsCountResponse> {
    const recipientId = session.user.id;
    return this.notificationsService.getUnreadCount(recipientId);
  }

  // Method      PUT /api/notifications/read
  // Description Mark all of the logged-in user's notifications as read
  @Put('read')
  @Roles(['user', 'admin'])
  markAllAsRead(
    @Session() session: UserSession,
  ): Promise<MarkAllNotificationsAsReadResponse> {
    const recipientId = session.user.id;
    return this.notificationsService.markAllAsRead(recipientId);
  }

  // Method      PUT /api/notifications/:notificationId/read
  // Description Mark one of the logged-in user's notifications as read
  @Put(':notificationId/read')
  @Roles(['user', 'admin'])
  markAsRead(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @Session() session: UserSession,
  ): Promise<Notification> {
    const recipientId = session.user.id;
    return this.notificationsService.markAsRead(recipientId, notificationId);
  }
}
